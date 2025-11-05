/**
 * Trademark Data Mapper
 * 
 * Transforms PROOFER questionnaire data to IP Service TRADEMARK_EXPERT format
 * 
 * @see /references/data mapper info.csv for field mappings
 * @see /references/sample-answer-bank-data-*.json for PROOFER data examples
 * @see /references/sample-answer-data.json for target format example
 */

import { entityTypeNameToId } from './entityTypeMap.js';
import { stateNameToId, getStateNameById } from './stateMap.js';
import { countryNameToId } from './countryMap.js';
import { signatoryTitleToPositionMap } from './signatoryTitleMap.js';
import { typeOfMarkToProtectMap } from './markTypeMap.js';
import { yesOrNoMap, intendToUseMarkMap } from './commonMaps.js';
import {
	formatPhoneNumber,
	splitFullName,
	getCountryNameById,
	createFieldLookup,
	createGroupLookup,
	safeLookup,
	parseUsedTrademarkInCommerce,
} from './mapperUtils.js';

/**
 * Maps PROOFER questionnaire data to TRADEMARK_EXPERT format
 * 
 * @param {object} prooferData - PROOFER questionnaire data
 * @param {Array} prooferData.fieldAnswers - Flat field answers
 * @param {Array} prooferData.groupAnswers - Grouped/repeatable field answers
 * @returns {object} - Transformed data in TRADEMARK_EXPERT format
 * 
 * @example Input structure (prooferData):
 * {
 *   userOrderId: "512037491",
 *   fieldAnswers: [
 *     { fieldName: "mark", fieldValue: "Corporation Slogan", ... }
 *   ],
 *   groupAnswers: [
 *     { groupName: "signatory_info_GRP", fieldName: "signatory_info_GRP_signature_ST_1", fieldValue: "Jane Doe", groupIndex: 1, ... }
 *   ]
 * }
 * 
 * @example Output structure (TRADEMARK_EXPERT):
 * {
 *   attorney: { firstName: "John", ... },
 *   owners: [{ ownerSelection: { ownerType: "individual" }, ... }],
 *   markSelection: { markFormat: "standard", ... },
 *   goodsAndServices: { ... },
 *   signatory: { signatoryName: "Jane Doe", ... }
 * }
 */
export const mapProoferToTrademarkExpert = (prooferData) => {
	try {
		// Create lookup maps for easy field access
		const fields = createFieldLookup(prooferData.fieldAnswers);
		const groups = createGroupLookup(prooferData.groupAnswers);
    
    const trademarkExpertData = {
			attorney: buildAttorney(fields),
			owners: buildOwners(fields, groups),
			markSelection: buildMarkSelection(fields),
			goodsAndServices: buildGoodsAndServices(fields),
			signatory: buildSignatory(fields, groups),
			additionalInformation: buildAdditionalInformation(fields),
    };

    return trademarkExpertData;
	} catch (error) {
		// Rethrow with more context about the mapping failure
		const errorMessage = `Failed to map PROOFER data to TRADEMARK_EXPERT format: ${error.message}`;
		console.error(errorMessage, error);
		throw new Error(errorMessage);
	}
};

/**
 * Builds the attorney section
 */
function buildAttorney(fields) {
	const attorneyFullName = fields['attorney_full_name_ST'];
	
	if (!attorneyFullName) {
		return {};
	}

	const { firstName, middleName, lastName } = splitFullName(attorneyFullName);

	return {
		firstName,
		middleName,
		lastName,
	};
}

/**
 * Builds address for a joint individual owner
 */
function buildJointIndividualOwnerAddress(groups, ownerNumber) {
	const getField = (fieldName) => getJointIndividualField(groups, fieldName, ownerNumber);
	
	const ownerStateAbbr = getField('owner_joint_info_state_MC');
	const ownerState = getStateNameById(ownerStateAbbr);
	const countryField = getField('owner_joint_info_country_MC');
	const outsideUSField = getField('owner_joint_info_country_outside_US_ST');

	// Determine owner country
	let ownerCountry;
	if (countryField === 'Other') {
		ownerCountry = outsideUSField;
	} else if (ownerState) {
		ownerCountry = 'United States';
	} else {
		ownerCountry = getCountryNameById(countryField);
	}

	return {
		ownerAddressLine1: getField('owner_joint_info_street_address_ST'),
		ownerAddressLine2: getField('owner_joint_info_apt_no_ST'),
		ownerCountry,
		ownerCity: getField('owner_joint_info_city_ST'),
		ownerState,
		ownerZipCode: getField('owner_joint_info_zip_code_ST'),
	};
}

/**
 * Builds domicile address for a joint individual owner
 */
function buildJointIndividualDomicileAddress(groups, ownerNumber) {
	const getField = (fieldName) => getJointIndividualField(groups, fieldName, ownerNumber);
	
	const domicileCountryField = getField('owner_joint_info_domicile_country_MC');
	const domicileOutsideUSField = getField('owner_joint_info_domicile_country_outside_US_ST');
	const domicileStateAbbr = getField('owner_joint_info_domicile_state_MC');
	const domicileState = getStateNameById(domicileStateAbbr);

	// Determine domicile country
	let domicileCountry;
	if (domicileCountryField === 'Other') {
		domicileCountry = domicileOutsideUSField;
	} else {
		const countryField = domicileCountryField || domicileOutsideUSField;
		domicileCountry = getCountryNameById(countryField);
	}

	return {
		domicileAddressLine1: getField('owner_joint_info_domicile_street_address_ST'),
		domicileCountry,
		domicileCity: getField('owner_joint_info_domicile_city_ST'),
		domicileState,
		domicileZipCode: getField('owner_joint_info_domicile_zip_code_ST'),
	};
}

/**
 * Checks if domicile data exists for a joint individual owner
 */
function checkJointIndividualHasDomicileData(groups, ownerNumber) {
	const getField = (fieldName) => getJointIndividualField(groups, fieldName, ownerNumber);
	
	return !!(
		getField('owner_joint_info_domicile_city_ST') ||
		getField('owner_joint_info_domicile_country_MC') ||
		getField('owner_joint_info_domicile_country_outside_US_ST') ||
		getField('owner_joint_info_domicile_state_MC') ||
		getField('owner_joint_info_domicile_street_address_ST') ||
		getField('owner_joint_info_domicile_zip_code_ST')
	);
}

/**
 * Gets a field value from group answers by field name and owner number
 */
function getJointIndividualField(groups, fieldName, ownerNumber) {
	const jointInfoGroup = groups['owner_joint_info'];
	if (!jointInfoGroup || jointInfoGroup.length === 0) {
		return null;
	}
	
	// Find the field with matching name and groupIndex
	const field = jointInfoGroup.find(f => 
		f.fieldName === `${fieldName}_${ownerNumber}` && 
		f.groupIndex === ownerNumber
	);
	
	return field ? field.fieldValue : null;
}

/**
 * Builds owners array for Joint Individuals (creates 2 owners)
 */
function buildJointIndividualOwners(fields, groups) {
	const owners = [];

	// Build both owner 1 and owner 2
	for (let ownerNumber = 1; ownerNumber <= 2; ownerNumber++) {
		// Helper to get field value for this owner
		const getField = (fieldName) => getJointIndividualField(groups, fieldName, ownerNumber);
		
		// Owner selection - both are individual type
		const ownerSelection = {
			ownerType: 'individual',
			incorporationCountry: 'United States',
		};

		// Individual owner data
		const individualOwner = {
			citizenshipCountry: getCountryNameById(getField('owner_joint_info_country')),
			firstName: getField('owner_joint_info_first'),
			middleName: getField('owner_joint_info_middle_initial_ST'),
			lastName: getField('owner_joint_info_last'),
		};

		// Build owner address
		const ownerAddress = buildJointIndividualOwnerAddress(groups, ownerNumber);

		// Build domicile address and check if it's different
		const domicileAddress = buildJointIndividualDomicileAddress(groups, ownerNumber);
		const hasDomicileData = checkJointIndividualHasDomicileData(groups, ownerNumber);
		const isDomicileDifferent = hasDomicileData && isAddressDifferent(ownerAddress, domicileAddress);
		const differentDomicile = isDomicileDifferent ? true : false;

		// DBA/AKA/TA logic - only for first owner
		let hasDBA = false;
		let dbaType = null;
		let alternateName = null;
		
		if (ownerNumber === 1) {
			const dbaChoiceField = fields['DBA_AKA_TA_FKA_Choice_MC'];
			alternateName = fields['DBA_AKA_TA_FKA_Value_ST'];
			
			if (dbaChoiceField) {
				const upperChoice = dbaChoiceField.toUpperCase();
				if (upperChoice.includes('DBA')) {
					hasDBA = true;
					dbaType = 'dba';
				} else if (upperChoice.includes('TA')) {
					dbaType = 'ta';
				} else if (upperChoice.includes('AKA')) {
					dbaType = 'aka';
				}
			}
		}

		const ownerItem = {
			ownerSelection,
			individualOwner,
			ownerAddress,
			differentDomicile,
			...(isDomicileDifferent && { domicileAddress }),
			ownerEmailAddress: getField('owner_joint_info_email_address_ST'),
			ownerPhoneNumber: formatPhoneNumber(getField('owner_joint_info_phone_number_ST')),
			hasDBA,
			...(dbaType && { dbaType }),
			...(alternateName && { alternateName }),
		};

		owners.push(ownerItem);
	}

	return owners;
}

/**
 * Builds the owners array
 */
function buildOwners(fields, groups) {
	const applicantType = fields['applicant_type_MC'];
	
	if (!applicantType) {
		return [];
	}

	// Handle Joint Individuals separately - creates 2 owners
	if (applicantType === 'Joint Individuals') {
		return buildJointIndividualOwners(fields, groups);
	}

	// Determine owner type
	const ownerType = applicantType.toLowerCase() === 'individual' ? 'individual' : 'juristic';

	// Build owner selection
	const ownerSelection = buildOwnerSelection(fields, applicantType, ownerType);

	// Build owner-specific data
	const owner = {};
	const individualOwner = {};
	const soleProprietor = {};

	if (ownerType === 'individual') {
		// Individual owner
		individualOwner.citizenshipCountry = getCountryNameById(fields['country_of_citizenship_']);
		individualOwner.firstName = fields['First_Name_of_Petitioner'];
		individualOwner.middleName = fields['applicant_middle_name_ST'];
		individualOwner.lastName = fields['Last_Name_of_Petitioner'];
	} else {
		// Juristic owner (corporation, etc.)
		// Use different field for Sole Proprietorship
		if (applicantType === 'Sole Proprietorship') {
			owner.corporationName = fields['name_of_applicant_soleprop'];
		} else {
			owner.corporationName = fields['Name_of_Applicant'];
		}
		owner.incorporationState = fields['state_country_organization_'];
	}

	// Sole proprietor citizenship
	soleProprietor.soleProprietorCountryOfCitizenship = getCountryNameById(fields['country_of_citizenship_']);

	// Build owner address
	const ownerAddress = buildOwnerAddress(fields);

	// Build domicile address and check if it's different from owner address
	const domicileAddress = buildDomicileAddress(fields);
	const hasDomicileData = checkHasDomicileData(fields);
	const isDomicileDifferent = hasDomicileData && isAddressDifferent(ownerAddress, domicileAddress);
	const differentDomicile = isDomicileDifferent ? true : false;

	// DBA/AKA/TA
	const dbaChoiceField = fields['DBA_AKA_TA_FKA_Choice_MC'];
	const alternateName = fields['DBA_AKA_TA_FKA_Value_ST'];
	
	let hasDBA = false;
	let dbaType = null;
	
	if (dbaChoiceField) {
		const upperChoice = dbaChoiceField.toUpperCase();
		if (upperChoice.includes('DBA')) {
			hasDBA = true;
			dbaType = 'dba';
		} else if (upperChoice.includes('TA')) {
			dbaType = 'ta';
		} else if (upperChoice.includes('AKA')) {
			dbaType = 'aka';
		}
	}

	const ownerItem = {
		ownerSelection,
		...(Object.keys(individualOwner).length > 0 && { individualOwner }),
		...(Object.keys(owner).length > 0 && { owner }),
		...(Object.keys(soleProprietor).length > 0 && { soleProprietor }),
		...(hasDBA && { hasDBA }),
		...(dbaType && { dbaType }),
		...(alternateName && { alternateName }),
		ownerAddress,
		differentDomicile,
		...(isDomicileDifferent && { domicileAddress }),
		ownerEmailAddress: fields['e_mail_address'],
		ownerPhoneNumber: formatPhoneNumber(fields['petitioner_s_telephone_number']),
	};

	return [ownerItem];
}

/**
 * Builds owner selection section
 */
function buildOwnerSelection(fields, applicantType, ownerType) {
	const country = fields['country'] || fields['entity_country'] || 'us';
	const incorporationCountry = getCountryNameById(country);

	const entityType = safeLookup(entityTypeNameToId, applicantType);
	const foreignEntityType_FreeForm = entityType || applicantType;

	// If applicantType is not in the entityTypeNameToId map, use it as entityTypeOther
	const entityTypeOther = !entityType ? applicantType : null;

	return {
		ownerType,
		incorporationCountry,
		...(entityType && { entityType }),
		foreignEntityType_FreeForm,
		...(entityTypeOther && { entityTypeOther }),
	};
}

/**
 * Builds owner address section
 */
function buildOwnerAddress(fields) {
	const ownerState = fields['State'];
	
	// If state is provided, country is United States
	// If country is 'Other', use the Outside_US_ field, otherwise use getCountryNameById
	let ownerCountry;
	if (fields['country'] === 'Other') {
		ownerCountry = fields['Outside_US_'];
	} else if (ownerState) {
		ownerCountry = 'United States';
	} else  {
		ownerCountry = getCountryNameById(fields['country']);
	}

	return {
		ownerAddressLine1: fields['street_address'],
		ownerAddressLine2: fields['apt_no'],
		ownerCountry,
		ownerCity: fields['City'],
		ownerState,
		ownerZipCode: fields['zip_code'],
	};
}

/**
 * Builds domicile address section
 */
function buildDomicileAddress(fields) {
	// If domicile_country_ST is 'Other', use the domicile_country_outside_US_ST field
	let domicileCountry;
	if (fields['domicile_country_ST'] === 'Other') {
		domicileCountry = fields['domicile_country_outside_US_ST'];
	} else {
		const countryField = fields['domicile_country_ST'] || fields['domicile_country_outside_US_ST'];
		domicileCountry = getCountryNameById(countryField);
	}

	return {
		domicileAddressLine1: fields['domicile_street_address_ST'],
		domicileCountry,
		domicileCity: fields['domicile_city_ST'],
		domicileState: fields['domicile_state_ST'],
		domicileZipCode: fields['domicile_zip_code_ST'],
	};
}

/**
 * Checks if domicile data exists
 */
function checkHasDomicileData(fields) {
	return !!(
		fields['domicile_street_address_ST'] ||
		fields['domicile_country_ST'] ||
		fields['domicile_country_outside_US_ST'] ||
		fields['domicile_city_ST'] ||
		fields['domicile_state_ST'] ||
		fields['domicile_zip_code_ST']
	);
}

/**
 * Compares two addresses to check if they are different
 */
function isAddressDifferent(ownerAddress, domicileAddress) {
	// Compare relevant address fields
	return (
		ownerAddress.ownerAddressLine1 !== domicileAddress.domicileAddressLine1 ||
		ownerAddress.ownerCity !== domicileAddress.domicileCity ||
		ownerAddress.ownerState !== domicileAddress.domicileState ||
		ownerAddress.ownerZipCode !== domicileAddress.domicileZipCode ||
		ownerAddress.ownerCountry !== domicileAddress.domicileCountry
	);
}

/**
 * Builds mark selection section
 */
function buildMarkSelection(fields) {
	const markFormat = safeLookup(typeOfMarkToProtectMap, fields['type_of_mark_to_protect_MC']);

	const standardCharacterMark = {
		markText: fields['mark'],
	};

	const designMark = buildDesignMark(fields);
	const nameAndLikeness = buildNameAndLikeness(fields);
	const persons = buildPersons(fields);
	const translationTransliteration = buildTranslationTransliteration(fields);
	const translationAndTransliterationIntakeQuestionnaire = {
		translationAndTransliteration_IntakePlaceholder: fields['foreign_language_words'],
	};

	return {
		markFormat,
		standardCharacterMark,
		designMark,
		nameAndLikeness,
		persons,
		translationTransliteration,
		translationAndTransliterationIntakeQuestionnaire,
	};
}

/**
 * Builds design mark section
 */
function buildDesignMark(fields) {
	const markDetailColor = fields['mark_detail_color'];
	const colorClaim = markDetailColor ? 'yes' : 'no';

	return {
		colorClaim,
		colorDescription: markDetailColor,
		literalElement: fields['Literal_Element_Only'],
		logoDescription: fields['mark_detail'],
	};
}

/**
 * Builds name and likeness section
 */
function buildNameAndLikeness(fields) {
	const containsNameLikeness = safeLookup(yesOrNoMap, fields['name_consent']);

	return {
		containsNameLikeness,
	};
}

/**
 * Builds persons array
 */
function buildPersons(fields) {
	const individualNameWithConsent = fields['AS_individual_name_with_consent_ST'];
	const hasConsent = individualNameWithConsent ? 'yes' : null;

	if (!hasConsent) {
		return [];
	}

	return [
		{
			hasConsent,
			nameConsent: individualNameWithConsent,
		},
	];
}

/**
 * Builds translation and transliteration array
 */
function buildTranslationTransliteration(fields) {
	const result = [];

	// Translation set
	const translationSetSource = fields['AS_eng_translation_of_ST'];
	const translationSetEnglish = fields['AS_eng_translation_is_ST'];
	const hasTranslationSet = translationSetSource || translationSetEnglish;

	// Transliteration set
	const transliterationSetSource = fields['AS_non_latin_chars_in_the_mark_ST'];
	const transliterationSetEnglish = fields['AS_non_latin_chars_in_the_mark_mean_ST'];
	const hasTransliterationSet = transliterationSetSource || transliterationSetEnglish;

	// Build translation set item
	if (hasTranslationSet) {
		const item = {};
		
		if (translationSetSource) {
			item.hasNonEnglishWords = 'yes';
			item.hasNonLatinCharacters = 'no';
			item.latinCharacters = {
				latinTranslation: translationSetSource,
			};
		}
		
		if (translationSetEnglish) {
			item.hasEnglishTranslation = 'yes';
			item.englishTranslation = translationSetEnglish;
		}
		
		result.push(item);
	}

	// Build transliteration set item
	if (hasTransliterationSet) {
		const item = {};
		
		if (transliterationSetSource) {
			item.hasNonEnglishWords = 'yes';
			item.hasNonLatinCharacters = 'yes';
			item.nonLatinCharacters = {
				nonLatinTransliteration: transliterationSetSource,
			}
			item.latinCharacters = {
				latinTranslation: transliterationSetSource,
			};
		}
		
		if (transliterationSetEnglish) {
			item.hasEnglishTranslation = 'yes';
			item.englishTranslation = transliterationSetEnglish;
		}
		
		result.push(item);
	}

	// If both sets are empty, return default structure
	if (result.length === 0) {
		result.push({
			hasNonEnglishWords: safeLookup(yesOrNoMap, fields['foreign_language']),
		});
	}

	return result;
}

/**
 * Builds goods and services section
 */
function buildGoodsAndServices(fields) {
	// Determine filing basis from trademark usage
	const trademarkUse1 = fields['gs_itu_G_S_filing_basis_internal_note_LT'];
	const trademarkUse2 = fields['gs_uic_G_S_filing_basis_internal_note_LT'];

	let howDoesTheClientPlanToUseTheirTrademark = null;
	if (trademarkUse1) {
		howDoesTheClientPlanToUseTheirTrademark = safeLookup(intendToUseMarkMap, trademarkUse1) || trademarkUse1;
	} else if (trademarkUse2) {
		howDoesTheClientPlanToUseTheirTrademark = safeLookup(intendToUseMarkMap, trademarkUse2) || trademarkUse2;
	}

	// Determine filing basis (yes/no)
	const filingBasis = determineFilingBasis(fields);

	// Build additional client trademark use info
	const clientTrademarkUse = buildClientTrademarkUseInfo(fields);

	return {
		filingBasis,
		howDoesTheClientPlanToUseTheirTrademarkSection: {
			howDoesTheClientPlanToUseTheirTrademark,
		},
		additionalDataSection: {
			clientTrademarkUse,
			competitorExample: fields['competitor_example'],
		},
	};
}

/**
 * Determines filing basis (yes = currently using, no = intent to use)
 */
function determineFilingBasis(fields) {
	const trademarkUse1 = fields['gs_itu_G_S_filing_basis_internal_note_LT'];
	const trademarkUse2 = fields['gs_uic_G_S_filing_basis_internal_note_LT'];

	const trademarkUse = trademarkUse1 || trademarkUse2;
	if (!trademarkUse) return null;

	const mapped = safeLookup(intendToUseMarkMap, trademarkUse);
	if (mapped === 'Yes, I\'m using this mark.') {
		return 'yes';
	} else if (mapped === 'No, but I intend to use it in the future.') {
		return 'no';
	}

	return null;
}

/**
 * Builds client trademark use additional information
 */
function buildClientTrademarkUseInfo(fields) {
	const applicantInternalNote = fields['applicant_information_internal_note_LT'];
	const filingBasisFromNote = parseUsedTrademarkInCommerce(applicantInternalNote);
	const filingBasisMapped = filingBasisFromNote ? safeLookup(intendToUseMarkMap, filingBasisFromNote) : null;

	const dateOfFirstSale = fields['date_of_first_sale'];
	const classNumber = fields['class_number'];
	const listGoodsOrServices = fields['list_goods_or_services'];
	const urlAssociatedWithTrademark = fields['url_associated_with_trademark'];

	const parts = [];
	if (filingBasisMapped) parts.push(`Filing Basis: ${filingBasisMapped}`);
	if (dateOfFirstSale) parts.push(`Date of First Sale: ${dateOfFirstSale}`);
	if (classNumber) parts.push(`Class Number: ${classNumber}`);
	if (listGoodsOrServices) parts.push(`List Goods or Services: ${listGoodsOrServices}`);
	if (urlAssociatedWithTrademark) parts.push(`URL Associated with Trademark: ${urlAssociatedWithTrademark}`);

	return parts.join('\n');
}

/**
 * Builds signatory section
 */
function buildSignatory(fields, groups) {
	// Try to get signatory name from group answers first, then flat fields
	let signatoryName = null;
	const signatoryGroup = groups['signatory_info_GRP'];
	if (signatoryGroup && signatoryGroup.length > 0) {
		const signatoryField = signatoryGroup.find(f => f.fieldName?.includes('signature_ST'));
		signatoryName = signatoryField?.fieldValue;
	}
	if (!signatoryName) {
		signatoryName = fields['signatory_name'];
	}

	// Try to get signatory title from group answers first, then flat fields
	let signatoryTitle = null;
	if (signatoryGroup && signatoryGroup.length > 0) {
		const titleField = signatoryGroup.find(f => f.fieldName?.includes('title_MC'));
		signatoryTitle = titleField?.fieldValue;
	}
	if (!signatoryTitle) {
		signatoryTitle = fields['signatory_title'];
	}

	const signatoryPosition = safeLookup(signatoryTitleToPositionMap, signatoryTitle);

	// Try to get other title from group answers first, then flat fields
	let otherSignatoryPosition = null;
	if (signatoryGroup && signatoryGroup.length > 0) {
		const otherTitleField = signatoryGroup.find(f => f.fieldName?.includes('other_title_ST'));
		otherSignatoryPosition = otherTitleField?.fieldValue;
	}
	if (!otherSignatoryPosition) {
		otherSignatoryPosition = fields['signatory_title_other'];
	}

	return {
		signatoryName,
		signatoryPosition,
		...(otherSignatoryPosition && { otherSignatoryPosition }),
	};
}

/**
 * Builds disclaimer section
 */
function buildDisclaimerSection(fields) {
	const disclaimerText = fields['AS_disclaimer_ST'];

	if (!disclaimerText) {
		return {};
	}

	return {
		disclaimerText,
	};
}

/**
 * Builds meaning and significance section
 */
function buildMeaningSignificanceSection(fields) {
	const wordOrPhrase = fields['AS_WLN_in_mark_ST'];
	const meaning = fields['AS_WLN_in_mark__term_of_art_ST'];

	if (!wordOrPhrase && !meaning) {
		return {};
	}

	return {
		meanings: [
			{
				wordOrPhrase,
				meaning,
			},
		],
	};
}

/**
 * Builds section 2f for whole mark claims
 */
function buildSection2fWhenWhole(fields) {
	const claimScopeRaw = fields['AS_2_f_claim_nature_MC'];
	let claimScope = null;
	if (claimScopeRaw) {
		const lower = claimScopeRaw.toLowerCase();
		if (lower.includes('entire') || lower.includes('whole')) {
			claimScope = 'entire_mark';
		} else if (lower.includes('portion') || lower.includes('part')) {
			claimScope = 'portion';
		}
	}

	// Build conditionPriorRegistration array
	const conditionPriorRegistration = [];
	
	// Check for whole mark fields
	const priorRegWholeCB = fields['AS_2fc_whole_is_based_on_active_prior_registration_CB'];
	const priorRegWhole = fields['AS_2fc_whole_active_prior_registrations_ST'];
	const fiveYearsWhole = fields['AS_2fc_whole_is_based_on_five_years_of_use_CB'];
	const evidenceWholeCB = fields['AS_2fc_whole_is_based_on_avidence_CB'];
	
	// Check for in-part fields
	const priorReg = fields['AS_2fc_inpart_is_based_on_active_prior_registration_ST'];
	const fiveYears = fields['AS_2fc_inpart_is_based_on_five_years_of_use_ST'];
	const evidence = fields['AS_2fc_inpart_is_based_on_avidence_ST'];

	// Determine which prior registration text to use
	let priorRegistrationsText = null;
	
	// Add to conditionPriorRegistration array based on fields
	// Check for prior registration (checkbox or text field for whole mark, or text field for in-part)
	if (priorRegWholeCB === '1' || priorRegWhole) {
		conditionPriorRegistration.push('priorRegistration');
		if (priorRegWhole) {
			priorRegistrationsText = priorRegWhole;
		}
	} else if (priorReg) {
		conditionPriorRegistration.push('priorRegistration');
		priorRegistrationsText = priorReg;
	}
	
	if (fiveYearsWhole === '1') {
		conditionPriorRegistration.push('fiveYearsUse');
	} else if (fiveYears) {
		conditionPriorRegistration.push('fiveYearsUse');
	}
	
	if (evidenceWholeCB === '1' || evidence) {
		conditionPriorRegistration.push('otherEvidence');
	}

	if (!claimScope && conditionPriorRegistration.length === 0 && !priorRegistrationsText && !evidence) {
		return {};
	}

	return {
		...(claimScope && { claimScope }),
		...(conditionPriorRegistration.length > 0 && { conditionPriorRegistration }),
		...(priorRegistrationsText && { priorRegistrationsText }),
		...(evidence && { otherEvidenceDoc: evidence }),
	};
}

/**
 * Builds section 2f for in-part (portion) claims
 */
function buildSection2fWhenInPart(fields) {
	// Set claimScope to "portion" for in-part claims
	const claimScope = 'portion';


	// TODO: get requirements

	return {
		claimScope,
	};
}

/**
 * Builds prior registrations section
 */
function buildPriorRegistrationsSection(fields) {
	const registrationFields = [
		fields['AS_active_prior_registration_1_ST'],
		fields['AS_active_prior_registration_2_ST'],
		fields['AS_active_prior_registration_3_ST'],
		fields['AS_active_prior_registration_4_ST'],
	];

	const registrations = [];

	registrationFields.forEach((field) => {
		if (!field) return;

		// AS_active_prior_registration_4_ST may have multiple comma-separated values
		const values = field.includes(',') ? field.split(',') : [field];

		values.forEach((value) => {
			const trimmedValue = value.trim();
			if (trimmedValue) {
				registrations.push({ registrationNumber: trimmedValue });
			}
		});
	});

	if (registrations.length === 0) {
		return {};
	}

	return {
		registrations,
	};
}

/**
 * Builds more information section
 */
function buildMoreInformationSection(fields) {
	const moreInformationText = fields['AS_miscellaneous_statement_LT'];

	if (!moreInformationText) {
		return {};
	}

	return {
		moreInformationText,
	};
}

/**
 * Builds additional information section
 */
function buildAdditionalInformation(fields) {
	// Check if additional trademark statement is Yes
	const hasAdditionalStatement = fields['additional_trademark_statement_MC'] === 'Yes';
	
	// Build subsections
	const disclaimerSection = buildDisclaimerSection(fields);
	const priorRegistrationsSection = buildPriorRegistrationsSection(fields);
	const meaningSignificanceSection = buildMeaningSignificanceSection(fields);
	const moreInformationSection = buildMoreInformationSection(fields);
	
	// Build section2f based on claim nature
	let section2f = {};
	if (fields['AS_2_f_claim_nature_MC'] === 'Whole') {
		section2f = buildSection2fWhenWhole(fields);
	} else if (fields['AS_2_f_claim_nature_MC'] === 'In Part') {
		section2f = buildSection2fWhenInPart(fields);
	}
	
	// Build selectAdditionalInformation array
	const selectAdditionalInformation = [];
	if (hasAdditionalStatement) {
		selectAdditionalInformation.push('disclaimer');
	}
	if (Object.keys(priorRegistrationsSection).length > 0) {
		selectAdditionalInformation.push('priorRegistrations');
	}
	// Add "meaning" if AS_WLN_in_mark_ST is not blank or null
	if (fields['AS_WLN_in_mark_ST']) {
		selectAdditionalInformation.push('meaning');
	}
	// Add "section2f" if AS_2_f_claim_nature_MC is "Whole" or "In Part"
	if (fields['AS_2_f_claim_nature_MC'] === 'Whole' || fields['AS_2_f_claim_nature_MC'] === 'In Part') {
		selectAdditionalInformation.push('section2f');
	}
	// Add "concurrentUse" if AS_concurrent_use_info_ST is not empty or blank
	if (fields['AS_concurrent_use_info_ST']) {
		selectAdditionalInformation.push('concurrentUse');
	}
	// Add "moreInformation" if AS_miscellaneous_statement_LT is not empty or blank
	if (fields['AS_miscellaneous_statement_LT']) {
		selectAdditionalInformation.push('moreInformation');
	}
	
	// Build the additional information object
	const additionalInfo = {
		...(selectAdditionalInformation.length > 0 && { selectAdditionalInformation }),
		...(Object.keys(disclaimerSection).length > 0 && { disclaimerSection }),
		...(Object.keys(priorRegistrationsSection).length > 0 && { priorRegistrationsSection }),
		...(Object.keys(meaningSignificanceSection).length > 0 && { meaningSignificanceSection }),
		...(Object.keys(section2f).length > 0 && { section2f }),
		...(Object.keys(moreInformationSection).length > 0 && { moreInformationSection }),
	};
	
	return additionalInfo;
}

