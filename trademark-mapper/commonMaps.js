/**
 * Common lookup maps for yes/no values and trademark usage intentions.
 */

/**
 * Maps yes/no variations to standardized values.
 * Lookup is case-insensitive (convert to lowercase before lookup).
 */
export const yesOrNoMap = {
	'yes': 'yes',
	'no': 'no',
};

/**
 * Maps trademark usage intentions to standardized values.
 * Lookup is case-insensitive (convert to lowercase before lookup).
 */
export const intendToUseMarkMap = {
	'customer stated that they are currently using the trademark.': 'Yes, I\'m using this mark.',
	'customer stated that they intent to use the trademark in the future.': 'No, but I intend to use it in the future.',
	'yes': 'Yes, I\'m using this mark.',
	'no': 'No, but I intend to use it in the future.',
};

