import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';

const SPREADSHEET_ID = '1zBBY-hOcMrurb-EoTFGKNxaZnPMLLdfCwjRLt9JLEaM';
const RANGE = 'Totals 19-24!A1:N21';

export interface GameData {
  year: string;
  gameType: string;
  monthlyResults: number[];
  totalForYear: number;
}

function cleanMoneyValue(value: string): number {
  if (!value || value.trim() === '') return 0;
  // Remove the shekel symbol and any spaces, then convert to number
  return parseFloat(value.replace('₪', '').replace(/\s+/g, ''));
}

export async function getSheetData() {
  try {
    // Read credentials from JSON file
    const credentialsPath = path.join(process.cwd(), 'google-credentials.json');
    console.log('Reading credentials from:', credentialsPath);
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('Credentials loaded successfully');

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    console.log('Auth client created');

    const sheets = google.sheets({ version: 'v4', auth });
    console.log('Sheets client created');
    
    console.log('Fetching data from spreadsheet:', SPREADSHEET_ID, 'range:', RANGE);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });
    console.log('Raw response:', JSON.stringify(response.data, null, 2));

    const rows = response.data.values;
    if (!rows) {
      console.log('No data found in the spreadsheet');
      return [];
    }

    const processedData: GameData[] = [];
    let currentYear = '';
    let currentGameType = '';

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const firstCell = row[0];
      if (!firstCell) continue;

      // Check if this is a header row containing the year and game type
      if (firstCell.includes('2021') || firstCell.includes('2022') || 
          firstCell.includes('2023') || firstCell.includes('2024')) {
        // Extract year from the header
        const yearMatch = firstCell.match(/\d{4}/);
        if (yearMatch) {
          currentYear = yearMatch[0];
        }
        
        // Extract game type
        if (firstCell.includes('Omaha Low Stakes')) {
          currentGameType = 'Omaha Low Stakes';
        } else if (firstCell.includes('High Stakes')) {
          currentGameType = 'High Stakes - Mixed';
        } else if (firstCell.includes('Cash Games')) {
          currentGameType = 'Cash Games';
        }

        // Look for the results in the next row
        const resultsRow = rows[i + 1];
        if (resultsRow) {
          const monthlyResults = resultsRow.slice(2, 14).map(val => cleanMoneyValue(val || '0'));
          const totalForYear = monthlyResults.reduce((acc, curr) => acc + curr, 0);

          processedData.push({
            year: currentYear,
            gameType: currentGameType,
            monthlyResults,
            totalForYear,
          });
        }
      }
    }

    console.log('Processed data:', JSON.stringify(processedData, null, 2));
    return processedData;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return [];
  }
} 