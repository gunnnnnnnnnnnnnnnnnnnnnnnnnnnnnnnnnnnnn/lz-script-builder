import { createFieldLookup } from './mapperUtils.js';

/**
 * Constant string used to identify internal notes that were migrated from Proofer.
 * This can be used to check if a note already exists before creating a new one.
 */
export const MIGRATED_FROM_PROOFER_TEXT = 'Migrated from Proofer';

/**
 * Creates an internal note JSON structure from Proofer data.
 * 
 * @param {Object} prooferData - The Proofer questionnaire field group answers
 * @returns {Object} The jsonNote structure ready to be sent to the ECP API
 */
export const buildInternalNoteFromProofer = (prooferData) => {
    const fieldLookup = createFieldLookup(prooferData.fieldAnswers || []);

    // Helper function to get field value or return empty string
    const getFieldValue = (fieldName) => {
        return fieldLookup[fieldName] || '';
    };

    return {
        root: {
            children: [
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: MIGRATED_FROM_PROOFER_TEXT,
                            type: 'text',
                            version: 1
                        }
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1
                },
                {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Intake Notes:',
                                    type: 'text',
                                    version: 1
                                },
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: ' ',
                                    type: 'text',
                                    version: 1
                                },
                                {
                                    type: 'linebreak',
                                    version: 1
                                },
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: getFieldValue('applicant_information_internal_note_LT'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 1
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Description of goods and/or Services: ',
                                    type: 'text',
                                    version: 1
                                },
                                {
                                    type: 'linebreak',
                                    version: 1
                                },
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: getFieldValue('list_goods_or_services'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 2
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'International Class Number: ',
                                    type: 'text',
                                    version: 1
                                },
                                {
                                    type: 'linebreak',
                                    version: 1
                                },
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: getFieldValue('gs_uic_international_class_number_MC'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 3
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Date of First Use Anywhere: ',
                                    type: 'text',
                                    version: 1
                                },
                                {
                                    type: 'linebreak',
                                    version: 1
                                },
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: getFieldValue('gs_uic_date_of_first_use_anywhere_ST'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 4
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Date of First Use in Commerce: ',
                                    type: 'text',
                                    version: 1
                                },
                                {
                                    type: 'linebreak',
                                    version: 1
                                },
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: getFieldValue('gs_uic_date_of_first_use_in_commerce_ST'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 5
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Specimen Description:',
                                    type: 'text',
                                    version: 1
                                },
                                {
                                    type: 'linebreak',
                                    version: 1
                                },
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: getFieldValue('gs_uic_specimen_description_ST'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 6
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Specimen URL:',
                                    type: 'text',
                                    version: 1
                                },
                                {
                                    type: 'linebreak',
                                    version: 1
                                },
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: getFieldValue('gs_uic_specimen_url_ST'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: null,
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 7
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Date of Specimen URL:',
                                    type: 'text',
                                    version: 1
                                },
                                {
                                    type: 'linebreak',
                                    version: 1
                                },
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: getFieldValue('gs_uic_date_of_specimen_url_ST'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 8
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'G&S Used in Commerce Filing Basis Internal Note:',
                                    type: 'text',
                                    version: 1
                                },
                                {
                                    type: 'linebreak',
                                    version: 1
                                },
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: getFieldValue('gs_uic_G_S_filing_basis_internal_note_LT'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 9
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Name of Sole Proprietor Petitioner:',
                                    type: 'text',
                                    version: 1
                                },
                                {
                                    type: 'linebreak',
                                    version: 1
                                },
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: getFieldValue('Name_of_Petitioner'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 10
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Partner\'s name, Citizenship OR where legally organized, Entity type (Use comma to separate):',
                                    type: 'text',
                                    version: 1
                                },
                                {
                                    type: 'linebreak',
                                    version: 1
                                },
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: getFieldValue('US_applicants_only_partnership'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 11
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Literal Element. Otherwise leave blank:',
                                    type: 'text',
                                    version: 1
                                },
                                {
                                    type: 'linebreak',
                                    version: 1
                                },
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: getFieldValue('Literal_Element_Only'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 12
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'If Logo is in Color, please complete the color list, otherwise leave blank if is Black & White:',
                                    type: 'text',
                                    version: 1
                                },
                                {
                                    type: 'linebreak',
                                    version: 1
                                },
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: getFieldValue('mark_detail_color'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 13
                        }
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'list',
                    version: 1,
                    listType: 'bullet',
                    start: 1,
                    tag: 'ul'
                }
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1
        }
    };
};

