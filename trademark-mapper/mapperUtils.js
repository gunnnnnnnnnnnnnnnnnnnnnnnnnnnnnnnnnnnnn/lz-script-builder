/**
 * Utility functions for data transformation and mapping
 */

import { countryIdToName } from './countryMap.js';

/**
 * Formats a phone number to US standard (+1XXXXXXXXXX format)
 * @param {string} phoneNumber - Raw phone number
 * @returns {string|null} - Formatted phone number or original if invalid
 */
export const formatPhoneNumber = (phoneNumber) => {
	if (!phoneNumber) return null;

	// Remove all non-digit characters
	const digitsOnly = phoneNumber.replace(/[^\d]/g, '');

	// Already formatted with +1
	if (phoneNumber.startsWith('+1') && digitsOnly.length === 11) {
		return phoneNumber;
	}
	// 10 digits - add +1 prefix
	if (digitsOnly.length === 10) {
		return `+1${digitsOnly}`;
	}
	// 11 digits starting with 1 - add + prefix
	if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
		return `+${digitsOnly}`;
	}
	// Not a valid US phone number format - return original
	return phoneNumber;
};

/**
 * Splits a full name into firstName, middleName, and lastName
 * Logic: 
 * - 1 name: use as lastName
 * - 2 names: firstName lastName
 * - 3+ names: firstName (everything in between as middleName) lastName
 * 
 * @param {string} fullName - Full name to split
 * @returns {object} - { firstName, middleName, lastName }
 */
export const splitFullName = (fullName) => {
	if (!fullName) {
		return { firstName: null, middleName: null, lastName: null };
	}

	const parts = fullName.trim().split(/\s+/);

	if (parts.length === 1) {
		// Only 1 name: use as last name
		return { firstName: null, middleName: null, lastName: parts[0] };
	} else if (parts.length === 2) {
		// 2 names: firstName lastName
		return { firstName: parts[0], middleName: null, lastName: parts[1] };
	} else {
		// 3+ names: firstName (middle names) lastName
		const firstName = parts[0];
		const lastName = parts[parts.length - 1];
		const middleName = parts.slice(1, -1).join(' ');
		return { firstName, middleName, lastName };
	}
};

/**
 * Gets country name by ID or returns the input if it's already a country name
 * @param {string} id - Country code or country name
 * @returns {string|null} - Country name or null if not found
 */
export const getCountryNameById = (id) => {
	if (!id) return null;

	const input = id.toLowerCase();

	// First try to convert from country code to name
	const countryName = countryIdToName[input];
	if (countryName) return countryName;

	// If not found, check if it's already a full country name and return as-is
	const isCountryName = Object.values(countryIdToName).some(
		(name) => name.toLowerCase() === input
	);
	if (isCountryName) {
		// Return with proper casing from the original input
		return id;
	}

	return null;
};

/**
 * Creates a field lookup map from fieldAnswers array
 * @param {Array} fieldAnswers - Array of field answer objects
 * @returns {object} - Map of fieldName to fieldValue (trimmed)
 */
export const createFieldLookup = (fieldAnswers) => {
	if (!fieldAnswers || !Array.isArray(fieldAnswers)) {
		return {};
	}
	
	return fieldAnswers.reduce((acc, field) => {
		if (field.fieldName && field.fieldValue !== undefined) {
			acc[field.fieldName] = typeof field.fieldValue === 'string' 
				? field.fieldValue.trim() 
				: field.fieldValue;
		}
		return acc;
	}, {});
};

/**
 * Creates a grouped field lookup map from groupAnswers array
 * @param {Array} groupAnswers - Array of group answer objects
 * @returns {object} - Map of groupName to array of fields within that group
 */
export const createGroupLookup = (groupAnswers) => {
	if (!groupAnswers || !Array.isArray(groupAnswers)) {
		return {};
	}
	
	return groupAnswers.reduce((acc, field) => {
		const groupName = field.groupName;
		if (!groupName) return acc;
		
		if (!acc[groupName]) {
			acc[groupName] = [];
		}
		
		acc[groupName].push({
			fieldName: field.fieldName,
			fieldValue: typeof field.fieldValue === 'string' 
				? field.fieldValue.trim() 
				: field.fieldValue,
			groupIndex: field.groupIndex,
		});
		
		return acc;
	}, {});
};

/**
 * Safe lookup in a map with case-insensitive key matching
 * @param {object} map - The lookup map
 * @param {string} key - The key to look up
 * @returns {*} - The mapped value or null if not found
 */
export const safeLookup = (map, key) => {
	if (!key || !map) return null;
	const lowerKey = String(key).toLowerCase();
	return map[lowerKey] || null;
};

/**
 * Parses "Used trademark in commerce" from internal note
 * @param {string} internalNote - Internal note text
 * @returns {string|null} - Parsed value or null
 */
export const parseUsedTrademarkInCommerce = (internalNote) => {
	if (!internalNote) return null;

	// Look for the line containing "Used trademark in commerce: Yes" or "Used trademark in commerce: No"
	const regex = /Used trademark in commerce:\s*(Yes|No)/i;
	const match = regex.exec(internalNote);

	if (match && match[1]) {
		return match[1].trim();
	}

	return null;
};

