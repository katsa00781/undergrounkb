"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export interface CustomBarChartProps {
    data:  { month: string; desktop: number; }[],
    config: ChartConfig
    margin?: {
        top?: number
        right?: number
        bottom?: number
        left?: number   
    },
    title: string
    description: string
    footer: string
    imgsrc?: string
    className?: string
    comment?: string
}




export function CustomBarChart({title, data, description, footer, imgsrc, className,config, comment}: CustomBarChartProps) {
  return (
    <Card className=" w-xs max-h-64">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            {footer}
        </div>
        <div className="leading-none text-muted-foreground">
            <p className="text-sm">{comment}</p>
        </div>
      </CardFooter>
    </Card>
  )
}
