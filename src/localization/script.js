const creds = require('./ryd-taxi-433810-c21677f1ee59.json')
const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const exportFolder = './';

const serviceAccountAuth = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(creds.sheet_id, serviceAccountAuth);

const write = async (data, columnKey) => {
  Object.keys(data).forEach(async key => {
    await fs.writeFile(
      `${exportFolder}/${key}.json`,
      JSON.stringify(data[key], null, 2),
      err => {
        if (err) {
          console.error(err);
        }
      },
    );
    if (key === columnKey) {
      let enumString = ``;
      for (const valueKey in data[key]) {
        const ele = data[key][valueKey];
        enumString += `${enumString ? '\n' : ''}  '${valueKey}' = '${ele}',`;
      }
      await fs.writeFile(
        `${exportFolder}/TranslationKeys.ts`,
        `export enum TranslationKeys {\n${enumString}\n}\n`,
        err => {
          if (err) {
            console.error(err);
          }
        },
      );
    }
  });
};

const getInfo = async () => {
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[1];
  await sheet.loadHeaderRow();
  let result = {};
  const colTitles = sheet.headerValues;
  const keyColumnName = colTitles[0];
  colTitles.forEach(col => {
    if (!!col) {
      result = { ...result, [col]: {} };
    }
  });

  const rows = await sheet.getRows({ limit: sheet.rowCount });
  rows.map(row => {
    const obj = row.toObject();
    for (const key in obj) {
      const value = obj[key];
      const valueKey = obj[keyColumnName];
      if (!!value && !!valueKey) {
        result[key][obj[keyColumnName]] = obj[key];
      }
    }
  });
  await write(result, keyColumnName);
};

getInfo();