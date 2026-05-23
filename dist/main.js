import { HyperAPIDriver } from "@hyperapi/core/dev";
import TelegramBot from "node-telegram-bot-api";

//#region src/libs/parse-callback-data.ts
/**
* Parses callback query data as URL path with query params
* @param data Callback query data string (e.g. "/e/4/p/32?u=123")
*/
function parseCallbackData(data, path_map) {
	try {
		const url = new URL(data, "https://n");
		if (Object.keys(path_map).length > 1) {
			const pathname_segments = url.pathname.split("/").map((v) => v.trim()).filter(Boolean);
			let new_pathname = "/";
			for (const segment of pathname_segments) {
				new_pathname += path_map[segment] || segment;
				new_pathname += "/";
			}
			return {
				path: new_pathname.slice(0, -1),
				args: Object.fromEntries(url.searchParams)
			};
		}
		return {
			path: url.pathname,
			args: Object.fromEntries(url.searchParams)
		};
	} catch {
		return;
	}
}

//#endregion
//#region src/handlers/callback-query.ts
/**
* Builds a HyperAPI request from a Telegram callback query
* @param query Callback query
* @param options
* @param options.bot Bot instance
* @param options.path_map Path map
*/
function handleCallbackQuery(query, { bot, path_map = {} }) {
	const { data } = query;
	if (!data) return;
	const parsed = parseCallbackData(data, path_map);
	if (!parsed) return;
	return {
		method: "UNKNOWN",
		bot,
		from: query.from,
		chat: query.message?.chat,
		telegram_update: {
			type: "callback_query",
			query
		},
		path: parsed.path,
		args: parsed.args
	};
}

//#endregion
//#region src/libs/parse-command.ts
/**
* Parses a bot command from a Telegram message
* @param options
* @param options.text Received text or caption
* @param options.username Bot username to filter commands addressed to other bots
* @param options.entities Message entities
*/
function parseCommand({ entities, text, username }) {
	if (!text.startsWith("/") || !entities || entities.length === 0) return;
	const command_entity = entities.find((entity) => entity.type === "bot_command" && entity.offset === 0);
	if (!command_entity) return;
	const [command, received_username] = text.slice(command_entity.offset, command_entity.offset + command_entity.length).split("@");
	if (!command || received_username !== void 0 && received_username !== username) return;
	return {
		command,
		content: text.slice(command_entity.offset + command_entity.length).trim()
	};
}

//#endregion
//#region src/handlers/message.ts
/**
* Builds a HyperAPI request from a Telegram message
* @param message Telegram message
* @param options
* @param options.bot Bot instance
* @param options.username Bot username
*/
function handleMessage(message, { bot, username }) {
	if (message.text === void 0 && message.caption === void 0) return;
	const text = message.text || message.caption || "";
	const base = {
		method: "UNKNOWN",
		bot,
		from: message.from,
		chat: message.chat,
		telegram_update: {
			type: "message",
			message
		}
	};
	const parsed = parseCommand({
		entities: message.entities || message.caption_entities,
		text,
		username
	});
	if (parsed === void 0) return {
		...base,
		path: "/messages",
		text
	};
	if (parsed.command === "/start") return {
		...base,
		path: "/commands/start",
		args: { payload: parsed.content.split(/\s+/)[0] }
	};
	return {
		...base,
		path: `/commands${parsed.command}`,
		args: { content: parsed.content }
	};
}

//#endregion
//#region node_modules/valibot/dist/index.mjs
let store$4;
/**
* Returns the global configuration.
*
* @param config The config to merge.
*
* @returns The configuration.
*/
/* @__NO_SIDE_EFFECTS__ */
function getGlobalConfig(config$1) {
	return {
		lang: config$1?.lang ?? store$4?.lang,
		message: config$1?.message,
		abortEarly: config$1?.abortEarly ?? store$4?.abortEarly,
		abortPipeEarly: config$1?.abortPipeEarly ?? store$4?.abortPipeEarly
	};
}
let store$3;
/**
* Returns a global error message.
*
* @param lang The language of the message.
*
* @returns The error message.
*/
/* @__NO_SIDE_EFFECTS__ */
function getGlobalMessage(lang) {
	return store$3?.get(lang);
}
let store$2;
/**
* Returns a schema error message.
*
* @param lang The language of the message.
*
* @returns The error message.
*/
/* @__NO_SIDE_EFFECTS__ */
function getSchemaMessage(lang) {
	return store$2?.get(lang);
}
let store$1;
/**
* Returns a specific error message.
*
* @param reference The identifier reference.
* @param lang The language of the message.
*
* @returns The error message.
*/
/* @__NO_SIDE_EFFECTS__ */
function getSpecificMessage(reference, lang) {
	return store$1?.get(reference)?.get(lang);
}
/**
* Stringifies an unknown input to a literal or type string.
*
* @param input The unknown input.
*
* @returns A literal or type string.
*
* @internal
*/
/* @__NO_SIDE_EFFECTS__ */
function _stringify(input) {
	const type = typeof input;
	if (type === "string") return `"${input}"`;
	if (type === "number" || type === "bigint" || type === "boolean") return `${input}`;
	if (type === "object" || type === "function") return (input && Object.getPrototypeOf(input)?.constructor?.name) ?? "null";
	return type;
}
/**
* Adds an issue to the dataset.
*
* @param context The issue context.
* @param label The issue label.
* @param dataset The input dataset.
* @param config The configuration.
* @param other The optional props.
*
* @internal
*/
function _addIssue(context, label, dataset, config$1, other) {
	const input = other && "input" in other ? other.input : dataset.value;
	const expected = other?.expected ?? context.expects ?? null;
	const received = other?.received ?? /* @__PURE__ */ _stringify(input);
	const issue = {
		kind: context.kind,
		type: context.type,
		input,
		expected,
		received,
		message: `Invalid ${label}: ${expected ? `Expected ${expected} but r` : "R"}eceived ${received}`,
		requirement: context.requirement,
		path: other?.path,
		issues: other?.issues,
		lang: config$1.lang,
		abortEarly: config$1.abortEarly,
		abortPipeEarly: config$1.abortPipeEarly
	};
	const isSchema = context.kind === "schema";
	const message$1 = other?.message ?? context.message ?? /* @__PURE__ */ getSpecificMessage(context.reference, issue.lang) ?? (isSchema ? /* @__PURE__ */ getSchemaMessage(issue.lang) : null) ?? config$1.message ?? /* @__PURE__ */ getGlobalMessage(issue.lang);
	if (message$1 !== void 0) issue.message = typeof message$1 === "function" ? message$1(issue) : message$1;
	if (isSchema) dataset.typed = false;
	if (dataset.issues) dataset.issues.push(issue);
	else dataset.issues = [issue];
}
/**
* Returns the Standard Schema properties.
*
* @param context The schema context.
*
* @returns The Standard Schema properties.
*/
/* @__NO_SIDE_EFFECTS__ */
function _getStandardProps(context) {
	return {
		version: 1,
		vendor: "valibot",
		validate(value$1) {
			return context["~run"]({ value: value$1 }, /* @__PURE__ */ getGlobalConfig());
		}
	};
}
/**
* Disallows inherited object properties and prevents object prototype
* pollution by disallowing certain keys.
*
* @param object The object to check.
* @param key The key to check.
*
* @returns Whether the key is allowed.
*
* @internal
*/
/* @__NO_SIDE_EFFECTS__ */
function _isValidObjectKey(object$1, key) {
	return Object.hasOwn(object$1, key) && key !== "__proto__" && key !== "prototype" && key !== "constructor";
}
/* @__NO_SIDE_EFFECTS__ */
function minLength(requirement, message$1) {
	return {
		kind: "validation",
		type: "min_length",
		reference: minLength,
		async: false,
		expects: `>=${requirement}`,
		requirement,
		message: message$1,
		"~run"(dataset, config$1) {
			if (dataset.typed && dataset.value.length < this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
			return dataset;
		}
	};
}
/**
* Creates a trim transformation action.
*
* @returns A trim action.
*/
/* @__NO_SIDE_EFFECTS__ */
function trim() {
	return {
		kind: "transformation",
		type: "trim",
		reference: trim,
		async: false,
		"~run"(dataset) {
			dataset.value = dataset.value.trim();
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function record(key, value$1, message$1) {
	return {
		kind: "schema",
		type: "record",
		reference: record,
		expects: "Object",
		async: false,
		key,
		value: value$1,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			const input = dataset.value;
			if (input && typeof input === "object") {
				dataset.typed = true;
				dataset.value = {};
				for (const entryKey in input) if (/* @__PURE__ */ _isValidObjectKey(input, entryKey)) {
					const entryValue = input[entryKey];
					const keyDataset = this.key["~run"]({ value: entryKey }, config$1);
					if (keyDataset.issues) {
						const pathItem = {
							type: "object",
							origin: "key",
							input,
							key: entryKey,
							value: entryValue
						};
						for (const issue of keyDataset.issues) {
							issue.path = [pathItem];
							dataset.issues?.push(issue);
						}
						if (!dataset.issues) dataset.issues = keyDataset.issues;
						if (config$1.abortEarly) {
							dataset.typed = false;
							break;
						}
					}
					const valueDataset = this.value["~run"]({ value: entryValue }, config$1);
					if (valueDataset.issues) {
						const pathItem = {
							type: "object",
							origin: "value",
							input,
							key: entryKey,
							value: entryValue
						};
						for (const issue of valueDataset.issues) {
							if (issue.path) issue.path.unshift(pathItem);
							else issue.path = [pathItem];
							dataset.issues?.push(issue);
						}
						if (!dataset.issues) dataset.issues = valueDataset.issues;
						if (config$1.abortEarly) {
							dataset.typed = false;
							break;
						}
					}
					if (!keyDataset.typed || !valueDataset.typed) dataset.typed = false;
					if (keyDataset.typed) dataset.value[keyDataset.value] = valueDataset.value;
				}
			} else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function string(message$1) {
	return {
		kind: "schema",
		type: "string",
		reference: string,
		expects: "string",
		async: false,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			if (typeof dataset.value === "string") dataset.typed = true;
			else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function pipe(...pipe$1) {
	return {
		...pipe$1[0],
		pipe: pipe$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			for (const item of pipe$1) if (item.kind !== "metadata") {
				if (dataset.issues && (item.kind === "schema" || item.kind === "transformation")) {
					dataset.typed = false;
					break;
				}
				if (!dataset.issues || !config$1.abortEarly && !config$1.abortPipeEarly) dataset = item["~run"](dataset, config$1);
			}
			return dataset;
		}
	};
}
/**
* Parses an unknown input based on a schema.
*
* @param schema The schema to be used.
* @param input The input to be parsed.
* @param config The parse configuration.
*
* @returns The parse result.
*/
/* @__NO_SIDE_EFFECTS__ */
function safeParse(schema, input, config$1) {
	const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config$1));
	return {
		typed: dataset.typed,
		success: !dataset.issues,
		output: dataset.value,
		issues: dataset.issues
	};
}

//#endregion
//#region src/libs/path-map.ts
const pathMapSchema = record(pipe(string(), trim(), minLength(1)), pipe(string(), trim(), minLength(1)));
/**
* Validates given path_map
* @param path_map
*/
function validate_path_map(path_map) {
	const result = safeParse(pathMapSchema, path_map);
	if (!result.success) {
		const errorMessages = result.issues.map((issue) => {
			const path = issue.path?.[0];
			if (path !== void 0) return path.origin === "key" ? `Validation failed for key "${path.key}": Expected non-empty string, but got "${path.key}"` : `Validation failed for "${path.key}" value: Expected non-empty string, but got "${path.value}"`;
			return `Your path map should be a record.`;
		});
		throw new Error(`Failed to initialize your path map:\n- ${errorMessages.join("\n- ")}`);
	}
}

//#endregion
//#region src/libs/telegram-error.ts
/**
* Checks if given error is a Telegram API error (ETELEGRAM)
* @param error
*/
function isTelegramError(error) {
	return error instanceof Error && "code" in error && error.code === "ETELEGRAM" && "response" in error;
}

//#endregion
//#region src/main.ts
var HyperAPITelegramDriver = class extends HyperAPIDriver {
	telegram;
	username;
	path_map;
	/**
	* @param options -
	* @param options.telegram_client - Telegram Bot Token
	* @param options.path_map
	*/
	constructor({ telegram_client, path_map }) {
		super();
		this.telegram = telegram_client;
		this.path_map = path_map;
		this.init().catch((error) => {
			console.error(`HyperAPI failed to initialize Telegram driver: ${error.message}`);
		});
	}
	async init() {
		try {
			if (this.telegram.isPolling() === false) throw new Error("Polling is disabled.");
			const { username } = await this.telegram.getMe();
			if (!username) throw new Error("Bot does not have username.");
			this.username = username;
			if (this.path_map) await validate_path_map(this.path_map);
			this.telegram.on("message", this.processMessage.bind(this));
			this.telegram.on("callback_query", this.processCallbackQuery.bind(this));
			this.telegram.on("polling_error", () => {});
			console.log(`Bot @${this.username} is running by HyperAPI.`);
		} catch (error) {
			if (error instanceof Error) throw new TypeError(error.message);
			throw error;
		}
	}
	/**
	* Processing request
	* @param request
	*/
	async processRequest(request) {
		try {
			await this.emitRequest(request);
		} catch (error) {
			if (isTelegramError(error)) {
				const tg_body = error.response?.body;
				if (tg_body && tg_body.description) console.error(`Telegram API Error ${tg_body.error_code}: ${tg_body.description}`);
				else console.error(`Telegram API Error: ${error.message}`);
			} else {
				console.error("Unhandled error in HyperAPI Telegram Driver:");
				console.error(error);
			}
		}
	}
	async processMessage(message) {
		const request = handleMessage(message, {
			bot: this.telegram,
			username: this.username
		});
		if (request) await this.processRequest(request);
	}
	processCallbackQuery(query) {
		const request = handleCallbackQuery(query, {
			bot: this.telegram,
			path_map: this.path_map
		});
		if (request) this.processRequest(request);
	}
};

//#endregion
export { HyperAPITelegramDriver };