import { getSheetData } from '@/lib/sheets';
import { PokerResults } from '@/components/PokerResults';

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  try {
    console.log('Fetching data...');
    const data = await getSheetData();
    console.log('Data fetched:', data);

    if (!data || data.length === 0) {
      return (
        <main className="container mx-auto py-8">
          <h1 className="text-4xl font-bold mb-8">Poker Tournament Results</h1>
          <p className="text-red-600">No data available. Please check the spreadsheet connection.</p>
        </main>
      );
    }

    return (
      <main className="container mx-auto py-8">
        <h1 className="text-4xl font-bold mb-8">Poker Tournament Results</h1>
        <PokerResults data={data} />
      </main>
    );
  } catch (error) {
    console.error('Error in page:', error);
    return (
      <main className="container mx-auto py-8">
        <h1 className="text-4xl font-bold mb-8">Poker Tournament Results</h1>
        <p className="text-red-600">Error loading data. Please try again later.</p>
      </main>
    );
  }
}

