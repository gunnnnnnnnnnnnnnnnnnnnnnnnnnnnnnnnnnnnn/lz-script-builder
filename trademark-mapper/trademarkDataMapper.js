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
import { stateNameToId } from './stateMap.js';
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
	// Create lookup maps for easy field access
	const fields = createFieldLookup(prooferData.fieldAnswers);
	const groups = createGroupLookup(prooferData.groupAnswers);

	const trademarkExpertData = {
		attorney: buildAttorney(fields),
		owners: buildOwners(fields),
		markSelection: buildMarkSelection(fields),
		goodsAndServices: buildGoodsAndServices(fields),
		signatory: buildSignatory(fields, groups),
		disclaimerSection: buildDisclaimerSection(fields),
		meaningSignificanceSection: buildMeaningSignificanceSection(fields),
		section2f: buildSection2f(fields),
	};

	return trademarkExpertData;
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
 * Builds the owners array
 */
function buildOwners(fields) {
	const applicantType = fields['applicant_type_MC'];
	
	if (!applicantType) {
		return [];
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
		owner.corporationName = fields['Name_of_Applicant'];
		const stateValue = fields['State'];
		owner.incorporationState = safeLookup(stateNameToId, stateValue);
	}

	// Sole proprietor citizenship
	soleProprietor.soleProprietorCountryOfCitizenship = getCountryNameById(fields['country_of_citizenship_']);

	// Build owner address
	const ownerAddress = buildOwnerAddress(fields);

	// Build domicile address
	const domicileAddress = buildDomicileAddress(fields);
	const hasDifferentDomicile = hasDomicileData(fields) ? 'yes' : null;

	// DBA/AKA
	const dbaType = fields['DBA_AKA_TA_FKA_Choice_MC'];
	const alternateName = fields['DBA_AKA_TA_FKA_Value_ST'];

	const ownerItem = {
		ownerSelection,
		...(Object.keys(individualOwner).length > 0 && { individualOwner }),
		...(Object.keys(owner).length > 0 && { owner }),
		...(Object.keys(soleProprietor).length > 0 && { soleProprietor }),
		...(dbaType && { dbaType }),
		...(alternateName && { alternateName }),
		ownerAddress,
		...(hasDifferentDomicile && { differentDomicile: hasDifferentDomicile }),
		...(hasDifferentDomicile && { domicileAddress }),
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
	const stateValue = fields['State'];
	const ownerState = safeLookup(stateNameToId, stateValue);
	
	// If state is valid US state, country is United States
	const ownerCountry = ownerState ? 'United States' : getCountryNameById(fields['country']);

	return {
		ownerAddressLine1: fields['street_address'],
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
	const domicileCountry = fields['domicile_country_ST'] || fields['domicile_country_outside_US_ST'];
	const domicileState = fields['domicile_state_ST'];

	return {
		domicileAddressLine1: fields['domicile_street_address_ST'],
		domicileCountry: getCountryNameById(domicileCountry),
		domicileCity: fields['domicile_city_ST'],
		domicileState: safeLookup(stateNameToId, domicileState),
		domicileZipCode: fields['domicile_zip_code_ST'],
	};
}

/**
 * Checks if domicile data exists
 */
function hasDomicileData(fields) {
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
	const hasNonEnglishWords = safeLookup(yesOrNoMap, fields['foreign_language']);
	const foreignLanguageWords = fields['foreign_language_words'];

	const nonLatinChars = fields['AS_non_latin_chars_in_the_mark_ST'];
	const hasNonLatinCharacters = nonLatinChars ? 'yes' : null;

	const nonLatinCharacters = {
		...(hasNonLatinCharacters && { hasNonLatinCharacters }),
		nonLatinTransliteration: fields['AS_non_latin_chars_in_the_mark_mean_ST'],
		nonLatinLanguage: nonLatinChars,
	};

	const englishTranslation = fields['AS_eng_translation_is_ST'];
	const hasEnglishTranslation = englishTranslation ? 'yes' : null;

	return [
		{
			hasNonEnglishWords,
			nonLatinCharacters,
			...(hasEnglishTranslation && { hasEnglishTranslation }),
			...(englishTranslation && { englishTranslation }),
		},
	];
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
	const meaning = fields['AS_WLN_in_mark_term_of_art_ST'];

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
 * Builds section 2f
 */
function buildSection2f(fields) {
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

	// Determine condition
	let conditionPriorRegistration = null;
	const priorReg = fields['AS_2fc_inpart_is_based_on_active_prior_registration_ST'];
	const fiveYears = fields['AS_2fc_inpart_is_based_on_five_years_of_use_ST'];
	const evidence = fields['AS_2fc_inpart_is_based_on_avidence_ST'];

	if (priorReg) {
		conditionPriorRegistration = 'priorRegistration';
	} else if (fiveYears) {
		conditionPriorRegistration = 'fiveYearsUse';
	} else if (evidence) {
		conditionPriorRegistration = 'otherEvidence';
	}

	if (!claimScope && !conditionPriorRegistration && !priorReg && !evidence) {
		return {};
	}

	return {
		...(claimScope && { claimScope }),
		...(conditionPriorRegistration && { conditionPriorRegistration }),
		...(priorReg && { priorRegistrationsText: priorReg }),
		...(evidence && { otherEvidenceDoc: evidence }),
	};
}

