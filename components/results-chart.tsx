"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import type { GameData } from "@/utils/process-data"

export function ResultsChart({ data }: { data: GameData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Results by Game Type</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            dailyOmaha: {
              label: "Daily Omaha",
              color: "hsl(var(--chart-1))",
            },
            mondayHigh: {
              label: "Monday High Stakes",
              color: "hsl(var(--chart-2))",
            },
            cashGames: {
              label: "Cash Games",
              color: "hsl(var(--chart-3))",
            },
            monthlyTotal: {
              label: "Monthly Total",
              color: "hsl(var(--chart-4))",
            },
          }}
          className="h-[400px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line type="monotone" dataKey="dailyOmaha" stroke="var(--color-dailyOmaha)" />
              <Line type="monotone" dataKey="mondayHigh" stroke="var(--color-mondayHigh)" />
              <Line type="monotone" dataKey="cashGames" stroke="var(--color-cashGames)" />
              <Line type="monotone" dataKey="monthlyTotal" stroke="var(--color-monthlyTotal)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

