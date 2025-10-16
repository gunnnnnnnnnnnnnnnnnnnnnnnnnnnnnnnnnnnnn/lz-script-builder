/**
 * Maps signatory title names to their standardized position IDs.
 * Lookup is case-insensitive (convert to lowercase before lookup).
 */
export const signatoryTitleToPositionMap = {
	'attorney of record': 'attorney-of-record',
	'ceo': 'ceo',
	'cfo': 'cfo',
	'coo': 'coo',
	'director': 'director',
	'founder': 'founder',
	'manager': 'manager',
	'managing partner': 'managing-partner',
	'member': 'member',
	'officer': 'officer',
	'partner': 'partner',
	'president': 'president',
	'principal': 'principal',
	'secretary': 'secretary',
	'treasurer': 'treasurer',
	'owner': 'owner',
	'vice president': 'vice-president',
	'other': 'other',
};

