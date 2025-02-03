import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { schedule } from 'node-cron';

// Initialize Google Sheets API
const sheets = google.sheets('v4');

interface RefreshStats {
  timestamp: number;
  totalRows: number;
  newRows: number;
  updatedRows: number;
  isAutomatic: boolean;
}

const STATS_FILE_PATH = join(process.cwd(), 'refresh-stats.json');

// Initialize stats file if it doesn't exist
if (!existsSync(STATS_FILE_PATH)) {
  writeFileSync(STATS_FILE_PATH, JSON.stringify({
    lastRefreshStats: null,
    refreshHistory: [],
    previousData: null
  }), 'utf-8');
}

// Read stats from file
function readStats() {
  try {
    const stats = JSON.parse(readFileSync(STATS_FILE_PATH, 'utf-8'));
    return {
      lastRefreshStats: stats.lastRefreshStats,
      refreshHistory: stats.refreshHistory || [],
      previousData: stats.previousData
    };
  } catch (error) {
    console.error('Error reading stats file:', error);
    return {
      lastRefreshStats: null,
      refreshHistory: [],
      previousData: null
    };
  }
}

// Write stats to file
function writeStats(stats: { lastRefreshStats: RefreshStats | null, refreshHistory: RefreshStats[], previousData: any[][] | null }) {
  try {
    writeFileSync(STATS_FILE_PATH, JSON.stringify(stats, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing stats file:', error);
  }
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
    // Read current stats
    const { lastRefreshStats, refreshHistory, previousData: prevData } = readStats();

    // Read credentials from file
    const credentialsPath = join(process.cwd(), 'google-credentials.json');
    const credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8'));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: '1zBBY-hOcMrurb-EoTFGKNxaZnPMLLdfCwjRLt9JLEaM',
      range: 'Totals 19-24!A1:N21',
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

    if (prevData) {
      // Find game type rows (rows that don't start with a number and aren't empty)
      const gameTypeRows = newData.filter((row) => {
        if (!row[0]) return false;
        const firstCell = row[0].toString().trim();
        return firstCell.includes('Stakes') || firstCell.includes('Cash Games');
      });

      const previousGameTypeRows = prevData.filter((row) => {
        if (!row[0]) return false;
        const firstCell = row[0].toString().trim();
        return firstCell.includes('Stakes') || firstCell.includes('Cash Games');
      });

      // Count updated rows (same game type but different values)
      stats.updatedRows = gameTypeRows.filter(row => {
        const prevRow = previousGameTypeRows.find(prev => prev[0] === row[0]);
        return prevRow && JSON.stringify(row) !== JSON.stringify(prevRow);
      }).length;

      console.log('Refresh stats calculated:', {
        totalGameTypes: gameTypeRows.length,
        previousGameTypes: previousGameTypeRows.length,
        updatedRows: stats.updatedRows
      });
    } else {
      // First time loading
      stats.updatedRows = newData.filter(row => {
        if (!row[0]) return false;
        const firstCell = row[0].toString().trim();
        return firstCell.includes('Stakes') || firstCell.includes('Cash Games');
      }).length;
    }

    // Update stored data
    const updatedHistory = [stats, ...(refreshHistory || [])].slice(0, 10); // Keep last 10 refreshes
    writeStats({
      lastRefreshStats: stats,
      refreshHistory: updatedHistory,
      previousData: newData
    });

    return {
      data: newData,
      stats,
      history: updatedHistory
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
      const { lastRefreshStats, refreshHistory } = readStats();
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