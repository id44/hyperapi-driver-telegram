interface TelegramApiError extends Error {
	code: 'ETELEGRAM';
	response: {
		body: {
			error_code: number;
			description: string;
		};
	};
}

/**
 * Checks if given error is a Telegram API error (ETELEGRAM)
 * @param error
 */
export function isTelegramError(error: unknown): error is TelegramApiError {
	return (
		error instanceof Error
		&& 'code' in error
		&& error.code === 'ETELEGRAM'
		&& 'response' in error
	);
}
