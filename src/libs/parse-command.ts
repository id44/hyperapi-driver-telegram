import type { MessageEntity } from 'node-telegram-bot-api';

export interface ParsedCommand {
	command: string;
	content: string;
}

/**
 * Parses a bot command from a Telegram message
 * @param options
 * @param options.text Received text or caption
 * @param options.username Bot username to filter commands addressed to other bots
 * @param options.entities Message entities
 */
export function parseCommand({
	entities,
	text,
	username,
}: {
	entities: MessageEntity[] | undefined;
	text: string;
	username: string;
}): ParsedCommand | undefined {
	if (!text.startsWith('/') || !entities || entities.length === 0) {
		return;
	}

	const command_entity = entities.find(
		(entity) => entity.type === 'bot_command' && entity.offset === 0,
	);

	if (!command_entity) {
		return;
	}

	const [command, received_username] = text
		.slice(command_entity.offset, command_entity.offset + command_entity.length)
		.split('@');

	if (
		!command
		|| (received_username !== undefined && received_username !== username)
	) {
		return;
	}

	return {
		command,
		content: text.slice(command_entity.offset + command_entity.length).trim(),
	};
}
