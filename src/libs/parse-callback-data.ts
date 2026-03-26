import type { PathMap } from './path-map.js';

export interface ParsedCallbackData {
	path: string;
	args: Record<string, string>;
}

/**
 * Parses callback query data as URL path with query params
 * @param data Callback query data string (e.g. "/e/4/p/32?u=123")
 */
export function parseCallbackData(
	data: string,
	path_map: PathMap,
): ParsedCallbackData | undefined {
	try {
		const url = new URL(data, 'https://n');

		if (Object.keys(path_map).length > 1) {
			const pathname_segments = url.pathname
				.split('/')
				.map((v) => v.trim())
				.filter(Boolean);
			let new_pathname = '/';

			for (const segment of pathname_segments) {
				new_pathname += path_map[segment] || segment;
				new_pathname += '/';
			}

			return {
				path: new_pathname.slice(0, -1),
				args: Object.fromEntries(url.searchParams),
			};
		}

		return {
			path: url.pathname,
			args: Object.fromEntries(url.searchParams),
		};
	} catch {
		return undefined;
	}
}
