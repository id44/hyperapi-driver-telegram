import { BaseRecord, EmptyObject, HyperAPIDriver, HyperAPIRequest } from "@hyperapi/core/dev";
import TelegramBot from "node-telegram-bot-api";
import * as v from "valibot";

//#region src/libs/path-map.d.ts
declare const pathMapSchema: v.RecordSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.TrimAction, v.MinLengthAction<string, 1, undefined>]>, v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.TrimAction, v.MinLengthAction<string, 1, undefined>]>, undefined>;
type PathMap = v.InferOutput<typeof pathMapSchema>;
//#endregion
//#region src/request.d.ts
type RequestArgs = Record<string, unknown>;
type TelegramUpdateData = {
  type: 'message';
  message: TelegramBot.Message;
  query?: never;
} | {
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
interface HyperAPITelegramRequest<A extends BaseRecord = EmptyObject> extends HyperAPIRequest<A>, HyperAPITelegramRequestBase {
  args: A;
}
//#endregion
//#region src/main.d.ts
interface Config {
  telegram_client: TelegramBot;
  path_map?: PathMap;
}
declare class HyperAPITelegramDriver extends HyperAPIDriver<HyperAPITelegramRequest<RequestArgs>> {
  private telegram;
  private username;
  private path_map;
  /**
   * @param options -
   * @param options.telegram_client - Telegram Bot Token
   * @param options.path_map
   */
  constructor({
    telegram_client,
    path_map
  }: Config);
  private init;
  /**
   * Processing request
   * @param request
   */
  private processRequest;
  private processMessage;
  private processCallbackQuery;
}
//#endregion
export { HyperAPITelegramDriver };