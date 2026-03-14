import { HyperAPIError } from '@hyperapi/core';
import { HyperAPIDriver } from '@hyperapi/core/dev';
import TelegramBot, {
	type CallbackQuery,
	type Message,
} from 'node-telegram-bot-api';
import type { HyperAPITelegramRequest, RequestArgs } from './request.js';

const REGEXP_START_COMMAND = /^\/start(\s+(.+)?)?$/;

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
	}

	/**
	 * Processing request
	 * @param request
	 */
	private async processRequest(request: HyperAPITelegramRequest) {
		try {
			const hyperapi_response = await this.emitRequest(request);
		} catch {}
	}

	/**
	 * Handles incoming message
	 * @param message - Message
	 */
	private processMessage(message: Message) {
		console.log(message);
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
			sendMessage: (text, options) =>
				// ! закинуть в очередь (которой еще нет)
				this.telegram.sendMessage(message.chat.id, text, options),

			editMessageText: (text, options) =>
				this.telegram.editMessageText(text, {
					chat_id: message.chat.id,
					...options,
				}),
		} as HyperAPITelegramRequest;

		let hyperapi_request: HyperAPITelegramRequest<RequestArgs>;

		const text = message.text || message.caption || '';
		let command: string | undefined;

		if (text.startsWith('/')) {
			const { entities } = message;

			if (entities && entities.length > 0) {
				const command_entity = entities.find(
					(entity) => entity.type === 'bot_command' && entity.offset === 0,
				);

				if (command_entity) {
					command = text
						.slice(
							command_entity.offset,
							command_entity.offset + command_entity.length,
						)
						.split('@')[0]; // removing bot username from commands like /start@some_bot
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

		// users.[id].callback.ts

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
			sendMessage: (text, options) =>
				this.telegram.sendMessage(message.chat.id, text, options),

			editMessageText: (text, options) =>
				this.telegram.editMessageText(text, {
					chat_id: message.chat.id,
					...options,
				}),
		} as HyperAPITelegramRequest;
	}

	// /e/4/p/32?u=123

	/** Catching polling errors */
	private catchPollingErrors() {
		// do nothing
	}

	/** Stops the server. */
	override destroy(): void {
		this.telegram.stopPolling();

		super.destroy();
	}
}

// export type {
// 	HyperAPIBunRequest,
// 	HyperAPIBunRequestWithArgs,
// 	HyperAPIBunRequestWithRequest,
// } from './request.js';
