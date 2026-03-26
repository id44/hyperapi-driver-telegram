/**
 * Checks if given string is a valid path
 * @param path
 */
export function isValidPath(path: string): boolean {
	try {
		const url = new URL(path, 'https://example.com');
		return url.origin === 'https://example.com';
	} catch {
		return false;
	}
}
