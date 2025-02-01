import { google } from 'googleapis';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SPREADSHEET_ID = '1zBBY-hOcMrurb-EoTFGKNxaZnPMLLdfCwjRLt9JLEaM';

export const SHEET_RANGES = {
  CASH_GAMES_2024: 'Cash Games 2024!A:Z',
  TOTALS: 'Totals 19-24!A:Z'
};

export async function getAuthClient() {
  const credentialsPath = path.join(process.cwd(), 'google-credentials.json');
  const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
    keyFile: credentialsPath
  });

  return auth;
}

export async function getSheetData(range: string) {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });

    return response.data.values;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
} 