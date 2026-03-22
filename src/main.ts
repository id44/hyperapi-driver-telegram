import { HyperAPIError } from '@hyperapi/core';
import { HyperAPIDriver } from '@hyperapi/core/dev';
import TelegramBot, {
	type CallbackQuery,
	type Message,
} from 'node-telegram-bot-api';
import type { HyperAPITelegramRequest, RequestArgs } from './request.js';

/**
 * Checks if given string is a valid path
 * @param path
 * @returns
 */
export function isValidPath(path: string): boolean {
	try {
		const url = new URL(path, 'https://example.com');
		return url.origin === 'https://example.com';
	} catch {
		return false;
	}
}

interface Config {
	telegram_bot_token: string;
}

export class HyperAPITelegramDriver extends HyperAPIDriver<
	HyperAPITelegramRequest<RequestArgs>
> {
	private telegram: TelegramBot;
	private username: string | undefined;

	/**
	 * @param options -
	 * @param options.telegram_bot_token - Telegram Bot Token
	 */
	constructor({ telegram_bot_token }: Config) {
		super();

		this.telegram = new TelegramBot(telegram_bot_token, {
			polling: true,
		});

		this.telegram.on('message', this.processMessage);
		this.telegram.on('callback_query', this.processCallbackQuery);

		this.telegram.on('polling_error', this.catchPollingErrors);

		this.init().catch((error) => {
			// oxlint-disable-next-line no-console
			console.error(`Failed to initialize Telegram Driver: ${error.message}`);
			this.destroy();
		});
	}

	private async init() {
		try {
			const me = await this.telegram.getMe();

			if (!me.username) {
				return;
			}

			this.username = me.username;

			// oxlint-disable-next-line no-console
			console.log(`Bot @${this.username} is running by HyperAPI.`);
		} catch (error) {
			if (error instanceof Error) {
				throw new TypeError(
					`Invalid token or connection error (${error.message})`,
				);
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
			if (
				error instanceof Error
				&& 'code' in error
				&& error.code === 'ETELEGRAM'
			) {
				// ! FIX ME
				const tgError = error as unknown;
				const tgBody = tgError.response?.body;

				if (tgBody && tgBody.description) {
					// oxlint-disable-next-line no-console
					console.error(
						`Telegram API Error ${tgBody.error_code}: ${tgBody.description}`,
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

	/**
	 * Handles incoming message
	 * @param message - Message
	 */
	private processMessage(message: Message) {
		if (!message.text && !message.caption) {
			return;
		}

		const hyperapi_request_base = {
			method: 'UNKNOWN',
			bot: this.telegram,
			from: message.from,
			chat: message.chat,
			telegram_update: {
				type: 'message',
				message,
			},
		} as HyperAPITelegramRequest;

		let hyperapi_request: HyperAPITelegramRequest<RequestArgs>;

		const text = message.text || message.caption || '';
		let command: string | undefined;

		if (text.startsWith('/')) {
			const { entities } = message;

			if (entities && entities.length > 0) {
				const command_entity = entities.find(
					// ignoring all commands that start not in the beginning of a message
					(entity) => entity.type === 'bot_command' && entity.offset === 0,
				);

				if (command_entity) {
					const [_command, username] = text
						.slice(
							command_entity.offset,
							command_entity.offset + command_entity.length,
						)
						.split('@');

					if (username === undefined || username === this.username) {
						command = _command;
					}
				}
			}
		}

		if (command === undefined) {
			hyperapi_request = {
				...hyperapi_request_base,
				path: '/messages/default',
			};
		}

		if (command === '/start') {
			hyperapi_request = {
				...hyperapi_request_base,
				path: '/commands/start',
				args: {
					payload: text.split(/\s+/)[1],
				},
			};
		} else {
			hyperapi_request = {
				...hyperapi_request_base,
				path: '/commands' + command + '.message',
			};
		}

		this.processRequest(hyperapi_request);
	}

	/**
	 * Handles incoming callback query
	 * @param query - Callback query
	 */
	private processCallbackQuery(query: CallbackQuery) {
		const { data, id, message } = query;

		const hyperapi_request_base = {
			method: 'UNKNOWN',
			bot: this.telegram,
			from: query.from,
			telegram_update: {
				type: 'callback_query',
				query,
			},
		} as HyperAPITelegramRequest;
	}

	// /e/4/p/32?u=123

	/** Catching polling errors */
	private catchPollingErrors() {
		// do nothing
	}

	/** Stops the server. */
	override destroy(): void {
		if (this.telegram.isPolling()) {
			this.telegram.stopPolling();
		}

		super.destroy();
	}
}

// export type {
// 	HyperAPIBunRequest,
// 	HyperAPIBunRequestWithArgs,
// 	HyperAPIBunRequestWithRequest,
// } from './request.js';
