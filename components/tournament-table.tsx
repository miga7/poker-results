import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const data = [
  { position: "1st", name: "Erez", chips: 1000, winnings: "$500" },
  { position: "2nd", name: "Scott", chips: 1000, winnings: "$500" },
  { position: "3rd", name: "Alon", chips: 600, winnings: "$300" },
  { position: "4th", name: "Mish", chips: 400, winnings: "$200" },
]

export function TournamentTable() {
  return (
    <Table>
      <TableCaption>Final Tournament Results</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Position</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Final Chips</TableHead>
          <TableHead>Winnings</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.name}>
            <TableCell>{row.position}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.chips}</TableCell>
            <TableCell>{row.winnings}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

