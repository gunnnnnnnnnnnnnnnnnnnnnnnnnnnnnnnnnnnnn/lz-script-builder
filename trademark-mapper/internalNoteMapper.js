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

    // Helper function to remove divider lines (lines with only "=" characters)
    const cleanDividerLines = (text) => {
        if (!text) return '';
        return text
            .split('\n')
            .filter(line => !line.trim().match(/^=+$/))
            .join('\n')
            .trim();
    };

    // Helper function to convert text with newlines into text/linebreak nodes
    const createTextNodesWithLinebreaks = (text) => {
        if (!text) return [];
        
        const cleanText = cleanDividerLines(text);
        // Split by \r\n, \n, or \r
        const lines = cleanText.split(/\r\n|\r|\n/);
        const nodes = [];
        
        lines.forEach((line, index) => {
            // Add text node for the line
            nodes.push({
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: line,
                type: 'text',
                version: 1
            });
            
            // Add linebreak after each line except the last one
            if (index < lines.length - 1) {
                nodes.push({
                    type: 'linebreak',
                    version: 1
                });
            }
        });
        
        return nodes;
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
                // Empty line between "Migrated from Proofer" and "Intake Notes"
                {
                    children: [],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1
                },
                // Section 1: Intake Notes (bold heading, not a bullet)
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: 'Intake Notes',
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
                // Intake Notes value as bullet
                {
                    children: [
                        {
                            children: createTextNodesWithLinebreaks(getFieldValue('applicant_information_internal_note_LT')),
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 1
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
                },
                // Divider
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '==============================================',
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
                // Section 2: Applicant Information (bold heading, not a bullet)
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: 'Applicant Information',
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
                // Applicant Information items as bullets
                {
                    children: [
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
                            value: 1
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
                            value: 2
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
                },
                // Divider
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '==============================================',
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
                // Section 3: Address & Contact Information (bold heading, not a bullet)
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: 'Address & Contact Information',
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
                // Address & Contact Information items as bullets
                {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Contact Name:',
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
                                    text: getFieldValue('Contact_Name'),
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
                },
                // Divider
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '==============================================',
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
                // Section 4: Mark & Filing Format (bold heading, not a bullet)
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: 'Mark & Filing Format',
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
                // Mark & Filing Format items as bullets
                {
                    children: [
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
                            value: 1
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
                            value: 2
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
                },
                // Divider
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '==============================================',
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
                // Section 5: Goods & Services (bold heading, not a bullet)
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: 'Goods & Services',
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
                // Goods & Services items as bullets
                {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Number of Classes:',
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
                                    text: getFieldValue('total___classes_'),
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
                                    text: 'Description of goods and/or Services:',
                                    type: 'text',
                                    version: 1
                                },
                                {
                                    type: 'linebreak',
                                    version: 1
                                },
                                ...createTextNodesWithLinebreaks(getFieldValue('list_goods_or_services'))
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 2
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
                },
                // Divider
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '==============================================',
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
                // Section 6: Goods and Services for Used in Commerce (bold heading, not a bullet)
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: 'Goods and Services for Used in Commerce',
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
                // Goods and Services for Used in Commerce items as bullets
                {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'International Class Number:',
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
                            value: 1
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Date of First Use Anywhere:',
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
                            value: 2
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Date of First Use in Commerce:',
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
                            value: 3
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
                            value: 6
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
                                ...createTextNodesWithLinebreaks(getFieldValue('gs_uic_G_S_filing_basis_internal_note_LT'))
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 7
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
                },
                // Divider
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '==============================================',
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
                // Section 7: Form Type (bold heading, not a bullet)
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: 'Form Type',
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
                // Form Type items as bullets
                {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Form Type:',
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
                                    text: getFieldValue('form_type_MC'),
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
                },
                // Divider
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '==============================================',
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
                // Section 8: Additional Statement (bold heading, not a bullet)
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: 'Additional Statement',
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
                // Additional Statement items as bullets
                {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Additional Trademark Statement?',
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
                                    text: getFieldValue('additional_trademark_statement_MC'),
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
                },
                // Divider
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '==============================================',
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
                // Section 9: Translation (English Translation & Wording) (bold heading, not a bullet)
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: 'Translation (English Translation & Wording)',
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
                // Translation items as bullets
                {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'The following wording within the mark, has no any meaning in a foreign language:',
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
                                    text: getFieldValue('AS_non_trans_in_foreign_language_ST'),
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
                },
                // Divider
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '==============================================',
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
                // Section 10: Transliteration (bold heading, not a bullet)
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: 'Transliteration',
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
                // Transliteration items as bullets
                {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Non-Latin characters in mark transliterate to following words & have no meaning in foreign language:',
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
                                    text: getFieldValue('AS_non_latin_chars_in_the_mark_no_mean_ST'),
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
                },
                // Divider
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '==============================================',
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
                // Section 11: Meaning or significance of wording, letter(s), or number(s) (bold heading, not a bullet)
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: 'Meaning or significance of wording, letter(s), or number(s)',
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
                // Meaning or significance items as bullets
                {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Please input here the word(s) appearing in the mark that has no significance nor is it a term of art:',
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
                                    text: getFieldValue('AS_WLN_in_the_mark_no_mean_ST'),
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
                                    text: 'The following word(s) have no meaning in a foreign language:',
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
                                    text: getFieldValue('AS_WLN_in_the_mark_no_mean_foreign_lang_ST'),
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
                },
                // Divider
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '==============================================',
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
                // Section 12: Name(s), Portrait(s), Signature(s) of Individual(s) (bold heading, not a bullet)
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: 'Name(s), Portrait(s), Signature(s) of Individual(s)',
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
                // Name(s), Portrait(s), Signature(s) items as bullets
                {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Please input the name of whom consent(s) to register is made of record:',
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
                                    text: getFieldValue('AS_individual_name_with_consent_ST'),
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
                                    text: 'Check if name(s)/portrait(s)/and/or signature(s) in mark does not identify living individual:',
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
                                    text: getFieldValue('AS_NPS_identifies_individual_CB') === '1' ? 'Yes' : 'No',
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
                },
                // Divider
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '==============================================',
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
                // Section 13: Use of the mark in another form (bold heading, not a bullet)
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: 'Use of the mark in another form',
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
                // Use of the mark in another form items as bullets
                {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Date of Use of the Mark in another Form Anywhere at least as (MM/DD/YYYY):',
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
                                    text: getFieldValue('AS_mark_date_of_use_anywhere_ST'),
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
                                    text: 'Date of Use of the Mark in Commerce at least as (MM/DD/YYYY):',
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
                                    text: getFieldValue('AS_mark_date_of_use_in_commerce_ST'),
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
                },
                // Divider
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '==============================================',
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
                // Section 13: Concurrent & Miscellaneous (bold heading, not a bullet)
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: 'Concurrent & Miscellaneous',
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
                // Concurrent & Miscellaneous items as bullets
                {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Concurrent Use Information:',
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
                                    text: getFieldValue('AS_concurrent_use_info_ST'),
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
                },
                // Divider
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '==============================================',
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
                // Section 14: Stippling Information (bold heading, not a bullet)
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: 'Stippling Information',
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
                // Stippling Information items as bullets
                {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Stippling as a Feature of the Mark:',
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
                                    text: getFieldValue('AS_stippling_as_feature_of_the_mark_CB') === '1' ? 'Yes' : 'No',
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
                                    text: 'Stippling for Shading:',
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
                                    text: getFieldValue('AS_stippling_for_shading_CB') === '1' ? 'Yes' : 'No',
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
                },
                // Divider
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '==============================================',
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
                // Section 15: Foreign Trademark Information (bold heading, not a bullet)
                {
                    children: [
                        {
                            detail: 0,
                            format: 1,
                            mode: 'normal',
                            style: '',
                            text: 'Foreign Trademark Information',
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
                // Foreign Trademark Information items as bullets
                {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Foreign Application:',
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
                                    text: getFieldValue('foreign_application_MC') === 'Yes' ? 'Yes' : 'No',
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
                                    text: 'Country of Foreign Filing:',
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
                                    text: getFieldValue('country_of_foreign_filing_'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 26
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Foreign Application Number:',
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
                                    text: getFieldValue('foreign_application_number_'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 27
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Date of Foreign Filing:',
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
                                    text: getFieldValue('date_of_foreign_filing_'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 28
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'At this time, the applicant intends to rely on Section 44(e) as a basis for registration:',
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
                                    text: getFieldValue('foreign_application_rely_on_44e_cb') === '1' ? 'Yes' : 'No',
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 35
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'At this time, the applicant has another basis for registration (Section 1(a) or Section 1(b)):',
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
                                    text: getFieldValue('foreign_application_rely_on_others_cb') === '1' ? 'Yes' : 'No',
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 36
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
                },
                // Section 6: Foreign Registration
                {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Foreign Registration:',
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
                                    text: getFieldValue('foreign_registration_MC') === 'Yes' ? 'Yes' : 'No',
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 29
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Country of Foreign Registration:',
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
                                    text: getFieldValue('country_of_foreign_regis_'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 30
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Foreign Registration Number:',
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
                                    text: getFieldValue('foreign_regis_number_'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 31
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Foreign Registration Date:',
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
                                    text: getFieldValue('foreign_regis_date_'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 32
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Foreign Registration Expiration (Required):',
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
                                    text: getFieldValue('foreign_regis_expiry_'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 33
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'Foreign Registration Renewal Date (Insert date, if applicable):',
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
                                    text: getFieldValue('foreign_regis_renewal_date_'),
                                    type: 'text',
                                    version: 1
                                }
                            ],
                            direction: 'ltr',
                            format: '',
                            indent: 0,
                            type: 'listitem',
                            version: 1,
                            value: 34
                        },
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 1,
                                    mode: 'normal',
                                    style: '',
                                    text: 'The FR includes a claim of Standard Characters or the country of origin Std Character equivalent:',
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
                                    text: getFieldValue('foreign_regis_includes_standard_characters_cb') === '1' ? 'Yes' : 'No',
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
                },
                // Divider
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: '==============================================',
                            type: 'text',
                            version: 1
                        }
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1
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

