import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { GameData } from "@/utils/process-data"

export function ResultsTable({ data }: { data: GameData[] }) {
  const totals = data.reduce(
    (acc, curr) => ({
      dailyOmaha: acc.dailyOmaha + curr.dailyOmaha,
      mondayHigh: acc.mondayHigh + curr.mondayHigh,
      cashGames: acc.cashGames + curr.cashGames,
      monthlyTotal: acc.monthlyTotal + curr.monthlyTotal,
    }),
    { dailyOmaha: 0, mondayHigh: 0, cashGames: 0, monthlyTotal: 0 },
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Game Type</TableHead>
          <TableHead className="text-right">Total Profit/Loss</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Daily Omaha</TableCell>
          <TableCell className={`text-right ${totals.dailyOmaha >= 0 ? "text-green-600" : "text-red-600"}`}>
            ₪{totals.dailyOmaha.toLocaleString()}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Monday High Stakes</TableCell>
          <TableCell className={`text-right ${totals.mondayHigh >= 0 ? "text-green-600" : "text-red-600"}`}>
            ₪{totals.mondayHigh.toLocaleString()}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Cash Games</TableCell>
          <TableCell className={`text-right ${totals.cashGames >= 0 ? "text-green-600" : "text-red-600"}`}>
            ₪{totals.cashGames.toLocaleString()}
          </TableCell>
        </TableRow>
        <TableRow className="font-bold">
          <TableCell>Total</TableCell>
          <TableCell className={`text-right ${totals.monthlyTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
            ₪{totals.monthlyTotal.toLocaleString()}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

