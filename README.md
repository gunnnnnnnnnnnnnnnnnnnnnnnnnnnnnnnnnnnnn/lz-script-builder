# lz-script-builder
This is what I use to build scripts to automate API requests

## Migrate Advisor By Firm
Creates an authentication user for active advisors based on the provided Advisor Domain firm ID, but only if an authentication user does not already exist for the corresponding advisor domain ID.
Associates the advisor's ID and the advisor domain firm ID with the partner attributes of the created authentication user.
Assigns the [LP_ATTORNEY] skill to the expert in the Experts Collaboration Platform (ECP).

### Procedure
1. Copy [`.sample.env`](https://github.com/gunnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn/lz-script-builder/blob/main/.env.sample) file as `.env` and set the ECP client secret. You can get them from the Vault.
2. Set the desired environment [here](https://github.com/gunnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn/lz-script-builder/blob/main/config.js#L5)
3. Update the Advisor domain firm id [here](https://github.com/gunnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn/lz-script-builder/blob/main/migrateAdvisorsByFirm.js#L16)
4. Update the firm account id that is mapped to ECP [here](https://github.com/gunnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn/lz-script-builder/blob/main/migrateAdvisorsByFirm.js#L17)
5. `npm ci` and `node ./migrateAdvisorsByFirm.js` to run the script.

## Migrate Consultations By Firm
Migrates open consultations to the Experts Collaboration Platform (ECP) as consultation work items based on the provided advisor domain firm ID.
Synchronizes existing consultations with corresponding work items if a work item already exists with the consultation’s confirmation ID.
If no matching work item exists, a new consultation work item is created.


### Procedure
1. Copy [`.sample.env`](https://github.com/gunnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn/lz-script-builder/blob/main/.env.sample) file as `.env` and set the ECP client secret. You can get them from the Vault.
2. Set the desired environment [here](https://github.com/gunnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn/lz-script-builder/blob/main/config.js#L5)
3. Update the Advisor domain firm id [here](https://github.com/gunnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn/lz-script-builder/blob/main/migrateConsultationsByFirm.js#L18)
4. Update the firm account id that is mapped to ECP [here](https://github.com/gunnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn/lz-script-builder/blob/main/migrateConsultationsByFirm.js#L19)
5. `npm ci` and `node ./migrateConsultationsByFirm.js` to run the script.
