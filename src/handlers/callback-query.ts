import type TelegramBot from 'node-telegram-bot-api';
import type { CallbackQuery } from 'node-telegram-bot-api';
import { parseCallbackData } from '../libs/parse-callback-data.js';
import type { PathMap } from '../libs/path-map.js';
import type { HyperAPITelegramRequest, RequestArgs } from '../request.js';

/**
 * Builds a HyperAPI request from a Telegram callback query
 * @param query Callback query
 * @param options
 * @param options.bot Bot instance
 * @param options.path_map Path map
 */
export function handleCallbackQuery(
	query: CallbackQuery,
	{
		bot,
		path_map = {},
	}: {
		bot: TelegramBot;
		path_map?: PathMap;
	},
): HyperAPITelegramRequest<RequestArgs> | undefined {
	const { data } = query;

	if (!data) {
		return;
	}

	const parsed = parseCallbackData(data, path_map);

	if (!parsed) {
		return;
	}

	return {
		method: 'UNDEF',
		bot,
		from: query.from,
		chat: query.message?.chat,
		telegram_update: {
			type: 'callback_query',
			query,
		},
		path: parsed.path,
		args: parsed.args,
	} as HyperAPITelegramRequest<RequestArgs>;
}
