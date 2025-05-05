
const creds = require('./ryd-taxi-433810-c21677f1ee59.json')
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');


const serviceAccountAuth = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(creds.sheet_id, serviceAccountAuth);

const AppStrings = {
    plan_changed: "Plan changed",
};


const keyData = Object.keys(AppStrings)
const valueData = Object.values(AppStrings)

const getInfo = async () =>{
      await doc.loadInfo();
const sheet = doc.sheetsByIndex[1];

for(i=0; i<=5; i++){
    await sheet.addRow({ key: keyData[i] , en: valueData[i]});
}

}
getInfo();

