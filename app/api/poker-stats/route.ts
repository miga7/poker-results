import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, SHEET_RANGES } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching poker stats data...');
    console.log('Sheet ranges:', SHEET_RANGES);
    
    const [cashGames2024, totals] = await Promise.all([
      getSheetData(SHEET_RANGES.CASH_GAMES_2024),
      getSheetData(SHEET_RANGES.TOTALS),
    ]);

    console.log('Raw Cash Games 2024 Data:', JSON.stringify(cashGames2024, null, 2));
    console.log('Raw Totals Data:', JSON.stringify(totals, null, 2));

    return NextResponse.json({
      cashGames2024,
      totals,
    });
  } catch (error) {
    console.error('Error in poker-stats API route:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to fetch poker statistics: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch poker statistics' },
      { status: 500 }
    );
  }
} 