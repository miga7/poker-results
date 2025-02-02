import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const players = [
  { name: "Erez", position: "1st", winnings: "$500" },
  { name: "Scott", position: "2nd", winnings: "$500" },
  { name: "Alon", position: "3rd", winnings: "$300" },
  { name: "Mish", position: "4th", winnings: "$200" },
]

export function LeftPane() {
  return (
    <ScrollArea className="h-[calc(100vh-2rem)] w-48 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Players</h4>
        {players.map((player, index) => (
          <div key={player.name}>
            <div className="text-sm">{player.name}</div>
            <div className="text-xs text-muted-foreground">
              {player.position} - {player.winnings}
            </div>
            {index < players.length - 1 && <Separator className="my-2" />}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

