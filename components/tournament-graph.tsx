"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { name: "Erez", chips: 1000 },
  { name: "Scott", chips: 1000 },
  { name: "Alon", chips: 600 },
  { name: "Mish", chips: 400 },
]

export function TournamentGraph() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Final Chip Count</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            chips: {
              label: "Chips",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="chips" fill="var(--color-chips)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

