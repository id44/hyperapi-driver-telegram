import { HyperAPIDriver } from '@hyperapi/core/dev';
import TelegramBot from 'node-telegram-bot-api';
import { handleCallbackQuery } from './handlers/callback-query.js';
import { handleMessage } from './handlers/message.js';
import { type PathMap, validate_path_map } from './libs/path-map.js';
import { isTelegramError } from './libs/telegram-error.js';
import type { HyperAPITelegramRequest, RequestArgs } from './request.js';

interface Config {
	telegram_client: TelegramBot;
	path_map?: PathMap;
}

export class HyperAPITelegramDriver extends HyperAPIDriver<
	HyperAPITelegramRequest<RequestArgs>
> {
	private telegram: TelegramBot;
	private username!: string;
	private path_map: PathMap | undefined;

	/**
	 * @param options -
	 * @param options.telegram_client - Telegram Bot Token
	 * @param options.path_map
	 */
	constructor({ telegram_client, path_map }: Config) {
		super();

		this.telegram = telegram_client;
		this.path_map = path_map;

		this.init().catch((error) => {
			// oxlint-disable-next-line no-console
			console.error(
				`HyperAPI failed to initialize Telegram driver: ${error.message}`,
			);
		});
	}

	private async init() {
		try {
			if (this.telegram.isPolling() === false) {
				throw new Error('Polling is disabled.');
			}

			const { username } = await this.telegram.getMe();

			if (!username) {
				// almost impossible error
				throw new Error('Bot does not have username.');
			}

			this.username = username;
			// !fixme
			if (this.path_map) {
				await validate_path_map(this.path_map);
			}

			this.telegram.on('message', this.processMessage.bind(this));
			this.telegram.on('callback_query', this.processCallbackQuery.bind(this));

			this.telegram.on('polling_error', () => {
				/* do nothing */
			});

			// oxlint-disable-next-line no-console
			console.log(`Bot @${this.username} is running by HyperAPI.`);
		} catch (error) {
			if (error instanceof Error) {
				throw new TypeError(error.message);
			}

			throw error;
		}
	}

	/**
	 * Processing request
	 * @param request
	 */
	private async processRequest(request: HyperAPITelegramRequest) {
		try {
			await this.emitRequest(request);
		} catch (error) {
			if (isTelegramError(error)) {
				const tg_body = error.response?.body;

				if (tg_body && tg_body.description) {
					// oxlint-disable-next-line no-console
					console.error(
						`Telegram API Error ${tg_body.error_code}: ${tg_body.description}`,
					);
				} else {
					// oxlint-disable-next-line no-console
					console.error(`Telegram API Error: ${error.message}`);
				}
			} else {
				// oxlint-disable-next-line no-console
				console.error('Unhandled error in HyperAPI Telegram Driver:');
				// oxlint-disable-next-line no-console
				console.error(error);
			}
		}
	}

	private async processMessage(message: TelegramBot.Message) {
		const request = handleMessage(message, {
			bot: this.telegram,
			username: this.username,
		});

		if (request) {
			await this.processRequest(request);
		}
	}

	private processCallbackQuery(query: TelegramBot.CallbackQuery) {
		const request = handleCallbackQuery(query, {
			bot: this.telegram,
			path_map: this.path_map,
		});
		if (request) {
			this.processRequest(request);
		}
	}
}
