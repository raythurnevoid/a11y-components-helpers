// Methods to use as {Array.filter} predicate

/**
 * Filter all nullish values from an array and ensure NonNullable return type.
 * @param item
 * @returns true if value is not null or undefined
 *
 * @example [0, 1, 2, null, 3, undefined].filter(notEmpty) => [0, 1, 2, 3]
 */
export function notEmpty<T>(item: T): item is NonNullable<T> {
	return Boolean(item);
}
