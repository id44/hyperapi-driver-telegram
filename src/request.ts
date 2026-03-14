import type {
	BaseRecord,
	EmptyObject,
	HyperAPIRequest,
} from '@hyperapi/core/dev';
import TelegramBot from 'node-telegram-bot-api';

export type RequestArgs = Record<string, unknown>;

export type TelegramUpdateData =
	| { type: 'message'; message: TelegramBot.Message; query?: never }
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
	sendMessage: (
		text: string,
		options?: TelegramBot.SendMessageOptions,
	) => Promise<TelegramBot.Message>;

	editMessageText: (
		text: string,
		options?: TelegramBot.EditMessageTextOptions,
	) => Promise<TelegramBot.Message | boolean>;
}

export interface HyperAPITelegramRequest<A extends BaseRecord = EmptyObject>
	extends HyperAPIRequest<A>,
		HyperAPITelegramRequestBase {
	args: A;
}

export type AllowedTelegramMethod =
	| 'getMe'
	| 'sendMessage'
	| 'forwardMessage'
	| 'copyMessage'
	| 'sendPhoto'
	| 'sendAudio'
	| 'sendDocument'
	| 'sendVideo'
	| 'sendAnimation'
	| 'sendVoice'
	| 'sendVideoNote'
	| 'sendMediaGroup'
	| 'sendLocation'
	| 'sendVenue'
	| 'sendContact'
	| 'sendPoll'
	| 'sendDice'
	| 'sendChatAction'
	| 'setMessageReaction'
	| 'getUserProfilePhotos'
	| 'getFile'
	| 'banChatMember'
	| 'unbanChatMember'
	| 'restrictChatMember'
	| 'promoteChatMember'
	| 'setChatAdministratorCustomTitle'
	| 'banChatSenderChat'
	| 'unbanChatSenderChat'
	| 'setChatPermissions'
	| 'exportChatInviteLink'
	| 'createChatInviteLink'
	| 'editChatInviteLink'
	| 'revokeChatInviteLink'
	| 'approveChatJoinRequest'
	| 'declineChatJoinRequest'
	| 'setChatPhoto'
	| 'deleteChatPhoto'
	| 'setChatTitle'
	| 'setChatDescription'
	| 'pinChatMessage'
	| 'unpinChatMessage'
	| 'unpinAllChatMessages'
	| 'leaveChat'
	| 'getChat'
	| 'getChatAdministrators'
	| 'getChatMemberCount'
	| 'getChatMember'
	| 'setChatStickerSet'
	| 'createForumTopic'
	| 'editForumTopic'
	| 'closeForumTopic'
	| 'reopenForumTopic'
	| 'deleteForumTopic'
	| 'unpinAllForumTopicMessages'
	| 'editGeneralForumTopic'
	| 'closeGeneralForumTopic'
	| 'reopenGeneralForumTopic'
	| 'hideGeneralForumTopic'
	| 'unhideGeneralForumTopic'
	| 'answerCallbackQuery'
	| 'setMyCommands'
	| 'deleteMyCommands'
	| 'getMyCommands'
	| 'setMyName'
	| 'getMyName'
	| 'setMyDescription'
	| 'getMyDescription'
	| 'setMyShortDescription'
	| 'getMyShortDescription'
	| 'setChatMenuButton'
	| 'getChatMenuButton'
	| 'setMyDefaultAdministratorRights'
	| 'getMyDefaultAdministratorRights'
	| 'editMessageText'
	| 'editMessageCaption'
	| 'editMessageMedia'
	| 'editMessageLiveLocation'
	| 'stopMessageLiveLocation'
	| 'editMessageReplyMarkup'
	| 'stopPoll'
	| 'deleteMessage'
	| 'sendSticker'
	| 'getStickerSet'
	| 'getCustomEmojiStickers'
	| 'uploadStickerFile'
	| 'createNewStickerSet'
	| 'addStickerToSet'
	| 'setStickerPositionInSet'
	| 'deleteStickerFromSet'
	| 'answerInlineQuery'
	| 'answerWebAppQuery'
	| 'sendInvoice'
	| 'createInvoiceLink'
	| 'answerShippingQuery'
	| 'answerPreCheckoutQuery'
	| 'sendGame'
	| 'setGameScore'
	| 'getGameHighScores';

type ExtractParams<T> = T extends (...args: infer P) => unknown ? P : unknown[];

export type HyperAPITelegramAction = {
	[K in AllowedTelegramMethod]: {
		method: K;
		params: K extends keyof TelegramBot
			? ExtractParams<TelegramBot[K]>
			: unknown[];
	};
}[AllowedTelegramMethod];

export type HyperAPITelegramResponse = HyperAPITelegramAction[] | undefined;
