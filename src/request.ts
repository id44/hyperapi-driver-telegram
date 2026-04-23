import type {
	BaseRecord,
	EmptyObject,
	HyperAPIRequest,
} from '@hyperapi/core/dev';
import TelegramBot from 'node-telegram-bot-api';

export type RequestArgs = Record<string, unknown>;

export type TelegramUpdateData =
	| {
			type: 'message';
			message: TelegramBot.Message;
			query?: never;
	  }
	| {
			type: 'callback_query';
			query: TelegramBot.CallbackQuery;
			message?: never;
	  };

interface HyperAPITelegramRequestBase {
	telegram_update: TelegramUpdateData;
	bot: TelegramBot;
	chat: TelegramBot.Chat;
	from?: TelegramBot.User;
}

export interface HyperAPITelegramRequest<A extends BaseRecord = EmptyObject>
	extends HyperAPIRequest<A>,
		HyperAPITelegramRequestBase {
	args: A;
}
