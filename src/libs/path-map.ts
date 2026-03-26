import * as v from 'valibot';

const pathMapSchema = v.record(
	v.pipe(v.string(), v.trim(), v.minLength(1)),
	v.pipe(v.string(), v.trim(), v.minLength(1)),
);

export type PathMap = v.InferOutput<typeof pathMapSchema>;

/**
 * Validates given path_map
 * @param path_map
 */
export function validate_path_map(path_map: unknown): void {
	const result = v.safeParse(pathMapSchema, path_map);

	if (!result.success) {
		const errorMessages = result.issues.map((issue) => {
			const path = issue.path?.[0];

			if (path !== undefined) {
				return path.origin === 'key'
					? `Validation failed for key "${path.key}": Expected non-empty string, but got "${path.key}"`
					: `Validation failed for "${path.key}" value: Expected non-empty string, but got "${path.value}"`;
			}

			return `Your path map should be a record.`;
		});

		throw new Error(
			`Failed to initialize your path map:\n- ${errorMessages.join('\n- ')}`,
		);
	}
}
