import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { schedule } from 'node-cron';

// Initialize Google Sheets API
const sheets = google.sheets('v4');

// In-memory storage for refresh stats
let lastRefreshStats: RefreshStats | null = null;
let refreshHistory: RefreshStats[] = [];
let previousData: any[][] | null = null;

interface RefreshStats {
  timestamp: number;
  totalRows: number;
  newRows: number;
  updatedRows: number;
  isAutomatic: boolean;
}

// Schedule data refresh every day at 5 AM
schedule('0 5 * * *', async () => {
  try {
    await refreshSpreadsheetData(true);
    console.log('Scheduled data refresh completed successfully');
  } catch (error) {
    console.error('Scheduled data refresh failed:', error);
  }
});

async function refreshSpreadsheetData(isAutomatic: boolean = false) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: process.env.SHEET_ID,
      range: process.env.SHEET_RANGE || 'Sheet1!A:N',
    });

    const newData = response.data.values || [];
    
    // Calculate statistics
    const stats: RefreshStats = {
      timestamp: Date.now(),
      totalRows: newData.length,
      newRows: 0,
      updatedRows: 0,
      isAutomatic
    };

    if (previousData) {
      // Find game type rows (rows that don't start with a number and aren't empty)
      const gameTypeRows = newData.filter((row, index) => {
        if (!row[0]) return false;
        const firstCell = row[0].toString().trim();
        return !firstCell.match(/^\d/) && firstCell !== '' && firstCell !== 'Game Type';
      });

      const previousGameTypeRows = previousData.filter((row, index) => {
        if (!row[0]) return false;
        const firstCell = row[0].toString().trim();
        return !firstCell.match(/^\d/) && firstCell !== '' && firstCell !== 'Game Type';
      });

      // Count new game types
      stats.newRows = gameTypeRows.filter(row => 
        !previousGameTypeRows.some(prevRow => prevRow[0] === row[0])
      ).length;

      // Count updated rows (same game type but different values)
      stats.updatedRows = gameTypeRows.filter(row => {
        const prevRow = previousGameTypeRows.find(prev => prev[0] === row[0]);
        return prevRow && JSON.stringify(row) !== JSON.stringify(prevRow);
      }).length;

      console.log('Refresh stats calculated:', {
        totalGameTypes: gameTypeRows.length,
        previousGameTypes: previousGameTypeRows.length,
        newRows: stats.newRows,
        updatedRows: stats.updatedRows
      });
    } else {
      // First time loading, all rows are new
      stats.newRows = newData.filter(row => {
        if (!row[0]) return false;
        const firstCell = row[0].toString().trim();
        return !firstCell.match(/^\d/) && firstCell !== '' && firstCell !== 'Game Type';
      }).length;
    }

    // Update stored data
    previousData = newData;
    lastRefreshStats = stats;
    refreshHistory.unshift(stats);
    refreshHistory = refreshHistory.slice(0, 10); // Keep last 10 refreshes

    return {
      data: newData,
      stats,
      history: refreshHistory
    };
  } catch (error) {
    console.error('Error fetching spreadsheet data:', error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    if (req.method === 'POST') {
      const result = await refreshSpreadsheetData(false);
      res.status(200).json({
        message: 'Data refreshed successfully',
        ...result
      });
    } else {
      // GET method to fetch last refresh stats and history
      res.status(200).json({
        lastStats: lastRefreshStats,
        history: refreshHistory
      });
    }
  } catch (error) {
    console.error('Error in refresh-data API:', error);
    res.status(500).json({ message: 'Failed to refresh data' });
  }
} 