import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { schedule } from 'node-cron';
import { getAuthClient, SHEET_RANGES } from '@/lib/sheets';

// Declare variables in global scope to persist between requests
declare global {
  var _lastRefreshStats: RefreshStats | null;
  var _refreshHistory: RefreshStats[];
  var _previousData: any[][] | null;
}

// Initialize global variables if they don't exist
if (!global._lastRefreshStats) global._lastRefreshStats = null;
if (!global._refreshHistory) global._refreshHistory = [];
if (!global._previousData) global._previousData = null;

interface RefreshStats {
  timestamp: number;
  totalRows: number;
  changedValues: number;
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
    console.log('Starting data refresh...');
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1zBBY-hOcMrurb-EoTFGKNxaZnPMLLdfCwjRLt9JLEaM',
      range: SHEET_RANGES.TOTALS,
    });

    const newData = response.data.values || [];
    console.log('Fetched data rows:', newData.length);
    
    // Calculate statistics
    const stats: RefreshStats = {
      timestamp: Date.now(),
      totalRows: newData.length,
      changedValues: 0,
      updatedRows: 0,
      isAutomatic
    };

    if (global._previousData) {
      console.log('Previous data exists, calculating changes...');
      // Find value rows (rows that contain actual data)
      const valueRows = newData.filter((row, index) => {
        if (!row[0]) return false;
        const firstCell = row[0].toString().trim();
        // Include rows that start with numbers (these are the value rows)
        return firstCell.match(/^\d/) || firstCell === '';
      });

      const previousValueRows = global._previousData.filter((row, index) => {
        if (!row[0]) return false;
        const firstCell = row[0].toString().trim();
        return firstCell.match(/^\d/) || firstCell === '';
      });

      console.log('Value rows found:', valueRows.length);
      console.log('Previous value rows:', previousValueRows.length);

      // Count changed values and updated rows
      let changedValues = 0;
      let updatedRows = 0;

      valueRows.forEach((row, rowIndex) => {
        const prevRow = previousValueRows[rowIndex];
        if (!prevRow) return;

        let hasChangesInRow = false;
        row.forEach((cell, cellIndex) => {
          const prevCell = prevRow[cellIndex];
          if (cell !== prevCell) {
            changedValues++;
            hasChangesInRow = true;
          }
        });

        if (hasChangesInRow) {
          updatedRows++;
        }
      });

      stats.changedValues = changedValues;
      stats.updatedRows = updatedRows;

      console.log('Refresh stats calculated:', {
        totalRows: stats.totalRows,
        changedValues: stats.changedValues,
        updatedRows: stats.updatedRows
      });
    } else {
      console.log('No previous data, counting initial values...');
      // First time loading, count all non-empty values
      stats.changedValues = newData.reduce((count, row) => {
        return count + row.filter(cell => cell !== '').length;
      }, 0);
      stats.updatedRows = newData.length;
      console.log('Initial stats:', stats);
    }

    // Update stored data in global scope
    global._previousData = newData;
    global._lastRefreshStats = stats;
    global._refreshHistory.unshift(stats);
    global._refreshHistory = global._refreshHistory.slice(0, 10); // Keep last 10 refreshes

    return {
      data: newData,
      stats,
      history: global._refreshHistory
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
        lastStats: global._lastRefreshStats,
        history: global._refreshHistory
      });
    }
  } catch (error) {
    console.error('Error in refresh-data API:', error);
    res.status(500).json({ message: 'Failed to refresh data' });
  }
} 