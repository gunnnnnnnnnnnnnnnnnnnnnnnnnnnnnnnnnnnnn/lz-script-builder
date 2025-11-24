/**
 * PDF Generator for Proofer Data
 * 
 * This module creates a formatted PDF document from PROOFER questionnaire data.
 * The generated PDF can be uploaded to ECP as an attachment.
 */

import PDFDocument from 'pdfkit';
import { createFieldLookup } from './mapperUtils.js';

/**
 * Generates the PDF filename based on processing order ID
 * Format: {{processingOrderId}}_Proofer data.pdf
 * 
 * @param {string} processingOrderId - Processing order ID
 * @returns {string} - Formatted filename
 * 
 * @example
 * getProoferPdfFilename('515612547') // Returns: "515612547_Proofer data.pdf"
 */
export const getProoferPdfFilename = (processingOrderId) => {
    return `${processingOrderId}_Proofer data.pdf`;
};

/**
 * Generates a PDF document from Proofer data
 * 
 * @param {Object} prooferData - The Proofer questionnaire field group answers
 * @param {string} processingOrderId - Processing order ID for the document
 * @returns {Promise<Buffer>} - Promise that resolves to PDF buffer
 * 
 * @example
 * const pdfBuffer = await generateProoferPdf(prooferData, '515612547');
 * // pdfBuffer can now be uploaded to ECP
 */
export const generateProoferPdf = (prooferData, processingOrderId) => {
    return new Promise((resolve, reject) => {
        try {
            // Create a new PDF document
            const doc = new PDFDocument({
                size: 'LETTER',
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                }
            });

            // Collect the PDF data in chunks
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Create field lookup
            const fieldLookup = createFieldLookup(prooferData.fieldAnswers || []);

            // Helper to get field value - ensure it returns a clean string
            const getField = (fieldName) => {
                const value = fieldLookup[fieldName];
                if (value === null || value === undefined) {
                    return '';
                }
                // Replace \r\n and \r with \n to avoid rendering issues in PDF
                return String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
            };

            // Helper to remove divider lines (lines with only "=" characters)
            const cleanDividerLines = (text) => {
                if (!text) return '';
                return text
                    .split('\n')
                    .filter(line => !line.trim().match(/^=+$/))
                    .join('\n')
                    .trim();
            };

            // Helper to add a horizontal divider line
            const addDivider = () => {
                doc.moveDown(0.5);
                const currentY = doc.y;
                const pageWidth = doc.page.width;
                
                doc.strokeColor('#cccccc')
                   .lineWidth(1)
                   .moveTo(50, currentY)
                   .lineTo(pageWidth - 50, currentY)
                   .stroke();
                
                // Reset stroke color to black for subsequent content
                doc.strokeColor('#000000');
                doc.moveDown(1);
            };

            // Helper to add a section header with value (not a field label)
            const addSection = (header, value) => {
                const cleanValue = cleanDividerLines(String(value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim());
                
                // Add section header
                doc.font('Helvetica-Bold')
                   .fontSize(12)
                   .fillColor('#000000')
                   .text(header);
                
                doc.moveDown(0.3);
                
                // Add value with indentation (if it exists)
                if (cleanValue && cleanValue !== '') {
                    doc.font('Helvetica')
                       .fontSize(10)
                       .fillColor('#000000')
                       .text(cleanValue, { indent: 20 });
                }
                
                doc.moveDown(0.7);
            };

            // Helper to add a field with label on one line and value on the next (matching internal note structure)
            const addField = (label, value) => {
                // Ensure label and value are clean strings and replace \r\n and \r with \n
                const cleanLabel = String(label || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
                const cleanValue = String(value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
                
                // Add bold label
                doc.font('Helvetica-Bold')
                   .fontSize(10)
                   .fillColor('#000000')
                   .text(cleanLabel);
                
                // Add value on next line with indentation (if it exists)
                if (cleanValue && cleanValue !== '') {
                    doc.font('Helvetica')
                       .fontSize(10)
                       .fillColor('#000000')
                       .text(cleanValue, { indent: 20 });
                }
                
                doc.moveDown(0.5);
            };

            // Document Title - "Migrated from Proofer" (matching internal note)
            doc.font('Helvetica-Bold')
               .fontSize(14)
               .fillColor('#000000')
               .text('Migrated from Proofer');
            
            doc.moveDown(1);

            // Content matching internal note structure exactly
            addSection('Intake Notes', getField('applicant_information_internal_note_LT'));
            addDivider();
            
            // Applicant Information Section
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#000000')
               .text('Applicant Information');
            doc.moveDown(0.5);
            
            addField('Name of Sole Proprietor Petitioner:', getField('Name_of_Petitioner'));
            addField('Partner\'s name, Citizenship OR where legally organized, Entity type (Use comma to separate):', getField('US_applicants_only_partnership'));
            addDivider();
            
            // Address & Contact Information Section
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#000000')
               .text('Address & Contact Information');
            doc.moveDown(0.5);
            
            addField('Contact Name:', getField('Contact_Name'));
            addDivider();
            
            // Mark & Filing Format Section
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#000000')
               .text('Mark & Filing Format');
            doc.moveDown(0.5);
            
            addField('Literal Element. Otherwise leave blank:', getField('Literal_Element_Only'));
            addField('If Logo is in Color, please complete the color list, otherwise leave blank if is Black & White:', getField('mark_detail_color'));
            addDivider();
            
            // Goods & Services Section
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#000000')
               .text('Goods & Services');
            doc.moveDown(0.5);
            
            addField('Number of Classes:', getField('total___classes_'));
            addField('Description of goods and/or Services:', getField('list_goods_or_services'));
            addDivider();
            
            // Goods and Services for Used in Commerce Section
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#000000')
               .text('Goods and Services for Used in Commerce');
            doc.moveDown(0.5);
            
            addField('International Class Number:', getField('gs_uic_international_class_number_MC'));
            addField('Date of First Use Anywhere:', getField('gs_uic_date_of_first_use_anywhere_ST'));
            addField('Date of First Use in Commerce:', getField('gs_uic_date_of_first_use_in_commerce_ST'));
            addField('Specimen Description:', getField('gs_uic_specimen_description_ST'));
            addField('Specimen URL:', getField('gs_uic_specimen_url_ST'));
            addField('Date of Specimen URL:', getField('gs_uic_date_of_specimen_url_ST'));
            addField('G&S Used in Commerce Filing Basis Internal Note:', getField('gs_uic_G_S_filing_basis_internal_note_LT'));
            addDivider();
            
            // Form Type Section
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#000000')
               .text('Form Type');
            doc.moveDown(0.5);
            
            addField('Form Type:', getField('form_type_MC'));
            addDivider();
            
            // Additional Statement Section
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#000000')
               .text('Additional Statement');
            doc.moveDown(0.5);
            
            addField('Additional Trademark Statement?', getField('additional_trademark_statement_MC'));
            addDivider();
            
            // Translation (English Translation & Wording) Section
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#000000')
               .text('Translation (English Translation & Wording)');
            doc.moveDown(0.5);
            
            addField('The following wording within the mark, has no any meaning in a foreign language:', getField('AS_non_trans_in_foreign_language_ST'));
            addDivider();
            
            // Transliteration Section
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#000000')
               .text('Transliteration');
            doc.moveDown(0.5);
            
            addField('Non-Latin characters in mark transliterate to following words & have no meaning in foreign language:', getField('AS_non_latin_chars_in_the_mark_no_mean_ST'));
            addDivider();
            
            // Meaning or significance of wording, letter(s), or number(s) Section
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#000000')
               .text('Meaning or significance of wording, letter(s), or number(s)');
            doc.moveDown(0.5);
            
            addField('Please input the name of whom consent(s) to register is made of record:', getField('AS_individual_name_with_consent_ST'));
            addField('Check if name(s)/portrait(s)/and/or signature(s) in mark does not identify living individual:', getField('AS_NPS_identifies_individual_CB') === '1' ? 'Yes' : 'No');
            addDivider();
            
            // Use of the mark in another form Section
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#000000')
               .text('Use of the mark in another form');
            doc.moveDown(0.5);
            
            addField('Date of Use of the Mark in another Form Anywhere at least as (MM/DD/YYYY):', getField('AS_mark_date_of_use_anywhere_ST'));
            addField('Date of Use of the Mark in Commerce at least as (MM/DD/YYYY):', getField('AS_mark_date_of_use_in_commerce_ST'));
            addDivider();
            
            // Concurrent & Miscellaneous Section
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#000000')
               .text('Concurrent & Miscellaneous');
            doc.moveDown(0.5);
            
            addField('Concurrent Use Information:', getField('AS_concurrent_use_info_ST'));
            addDivider();
            
            // Stippling Information Section
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#000000')
               .text('Stippling Information');
            doc.moveDown(0.5);
            
            addField('Stippling as a Feature of the Mark:', getField('AS_stippling_as_feature_of_the_mark_CB') === '1' ? 'Yes' : 'No');
            addField('Stippling for Shading:', getField('AS_stippling_for_shading_CB') === '1' ? 'Yes' : 'No');
            addDivider();
            
            // Foreign Trademark Information Section
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#000000')
               .text('Foreign Trademark Information');
            doc.moveDown(0.5);
            
            addField('Foreign Application:', getField('foreign_application_MC') === 'Yes' ? 'Yes' : 'No');
            addField('Country of Foreign Filing:', getField('country_of_foreign_filing_'));
            addField('Foreign Application Number:', getField('country_of_foreign_regis_'));
            addField('Date of Foreign Filing:', getField('date_of_foreign_filing_'));
            addField('At this time, the applicant intends to rely on Section 44(e) as a basis for registration:', getField('foreign_application_rely_on_44e_cb') === '1' ? 'Yes' : 'No');
            addField('At this time, the applicant has another basis for registration (Section 1(a) or Section 1(b)):', getField('foreign_application_rely_on_others_cb') === '1' ? 'Yes' : 'No');
            addField('Foreign Registration:', getField('foreign_registration_MC') === 'Yes' ? 'Yes' : 'No');
            addField('Country of Foreign Registration:', getField('country_of_foreign_regis_'));
            addField('Foreign Registration Number:', getField('foreign_regis_number_'));
            addField('Foreign Registration Date:', getField('foreign_regis_date_'));
            addField('Foreign Registration Expiration (Required):', getField('foreign_regis_expiry_'));
            addField('Foreign Registration Renewal Date (Insert date, if applicable):', getField('foreign_regis_renewal_date_'));
            addField('The FR includes a claim of Standard Characters or the country of origin Std Character equivalent:', getField('foreign_regis_includes_standard_characters_cb') === '1' ? 'Yes' : 'No');
            addDivider();

            // Footer with processing order ID
            doc.moveDown(2);
            doc.font('Helvetica')
               .fontSize(8)
               .fillColor('#7f8c8d')
               .text(`Processing Order ID: ${processingOrderId} | Generated on ${new Date().toLocaleString()}`, { align: 'center' });

            // Finalize the PDF
            doc.end();

        } catch (error) {
            reject(new Error(`Failed to generate PDF: ${error.message}`));
        }
    });
};
