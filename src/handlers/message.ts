import type TelegramBot from 'node-telegram-bot-api';
import type { Message } from 'node-telegram-bot-api';
import { parseCommand } from '../libs/parse-command.js';
import type { HyperAPITelegramRequest, RequestArgs } from '../request.js';

/**
 * Builds a HyperAPI request from a Telegram message
 * @param message Telegram message
 * @param options
 * @param options.bot Bot instance
 * @param options.username Bot username
 */
export function handleMessage(
	message: Message,
	{
		bot,
		username,
	}: {
		bot: TelegramBot;
		username: string;
	},
): HyperAPITelegramRequest<RequestArgs> | undefined {
	if (message.text === undefined && message.caption === undefined) {
		return;
	}

	const text = message.text || message.caption || '';

	const base = {
		method: 'UNKNOWN',
		bot,
		from: message.from,
		chat: message.chat,
		telegram_update: {
			type: 'message',
			message,
		},
	} as HyperAPITelegramRequest;

	const parsed = parseCommand({
		entities: message.entities,
		text,
		username,
	});

	if (parsed === undefined) {
		// oxlint-disable-next-line no-warning-comments
		// TODO: pass message text in args
		return {
			...base,
			path: '/messages', // core will route this to index.ts in this directory
			text,
		} as HyperAPITelegramRequest<RequestArgs>;
	}

	if (parsed.command === '/start') {
		return {
			...base,
			path: '/commands/start',
			args: {
				payload: parsed.content.split(/\s+/)[0],
			},
		} as HyperAPITelegramRequest<RequestArgs>;
	}

	return {
		...base,
		path: `/commands${parsed.command}`,
		args: {
			content: parsed.content,
		},
	} as HyperAPITelegramRequest<RequestArgs>;
}
