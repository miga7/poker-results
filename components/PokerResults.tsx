import { GameData } from '@/lib/sheets';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

interface PokerResultsProps {
  data: GameData[];
}

export function PokerResults({ data }: PokerResultsProps) {
  const calculateMonthlyTotals = (data: GameData[]) => {
    const monthlyTotals = new Array(12).fill(0);
    data.forEach(game => {
      game.monthlyResults.forEach((result, index) => {
        monthlyTotals[index] += result;
      });
    });
    return monthlyTotals;
  };

  const groupedByYear = data.reduce((acc, game) => {
    if (!acc[game.year]) {
      acc[game.year] = [];
    }
    acc[game.year].push(game);
    return acc;
  }, {} as Record<string, GameData[]>);

  return (
    <div className="space-y-8">
      {Object.entries(groupedByYear).map(([year, yearData]) => (
        <div key={year} className="rounded-lg border p-4">
          <h2 className="text-2xl font-bold mb-4">{year} Results</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game Type</TableHead>
                {months.map(month => (
                  <TableHead key={month}>{month}</TableHead>
                ))}
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yearData.map((game, index) => (
                <TableRow key={`${game.gameType}-${index}`}>
                  <TableCell className="font-medium">{game.gameType}</TableCell>
                  {game.monthlyResults.map((result, i) => (
                    <TableCell key={i} className={result >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {result.toFixed(2)}
                    </TableCell>
                  ))}
                  <TableCell className={game.totalForYear >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {game.totalForYear.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">Monthly Total</TableCell>
                {calculateMonthlyTotals(yearData).map((total, i) => (
                  <TableCell key={i} className={`font-bold ${total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {total.toFixed(2)}
                  </TableCell>
                ))}
                <TableCell className={`font-bold ${yearData.reduce((acc, game) => acc + game.totalForYear, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {yearData.reduce((acc, game) => acc + game.totalForYear, 0).toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
} 