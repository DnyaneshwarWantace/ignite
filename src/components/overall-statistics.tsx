"use client";

import * as React from "react";
import { Dot, DotIcon, TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Box, Flex } from "@radix-ui/themes";
import { Typography } from "./ui/typography";
import { Chip } from "./ui/chip";

export const description = "A donut chart with text";

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  video: {
    label: "video",
    color: "hsl(var(--chart-1))",
  },
  image: {
    label: "image",
    color: "hsl(var(--chart-2))",
  },
  carousal: {
    label: "carousal",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

type AdCounts = {
  noOfGifAds: number;
  noOfImageAds: number;
  noOfVideoAds: number;
  totalAds: number;
  activeAds: number;
};

export default function OverallStatistics({ noOfGifAds = 0, noOfImageAds = 0, noOfVideoAds = 0, totalAds = 0, activeAds = 0 }: AdCounts) {
  const chartData = [
    { browser: "image", visitors: noOfImageAds, fill: "var(--color-image)" },
    { browser: "video", visitors: noOfVideoAds, fill: "var(--color-video)" },
    { browser: "carousal", visitors: noOfGifAds, fill: "var(--color-carousal)" },
  ];
  
  return (
    <>
      <ChartContainer config={chartConfig} className="mx-auto min-w-[200px] aspect-square max-h-[250px]">
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie data={chartData} dataKey="visitors" nameKey="browser" innerRadius={60} strokeWidth={6}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                        {activeAds}
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                        Ads Running
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      <Flex direction={"column"}>
        <Flex direction={"row"} justify={"between"} align={"center"}>
          <Chip label="Videos" icon={<Dot size={50} className="text-chart-1 " />} className="bg-opacity-0 " iconPosition="left" />

          <Flex gap={"2"}>
            <Typography variant="subtitle" className="text-sm font-medium text-black">
              {noOfVideoAds}
            </Typography>
            {/* <Typography variant="subtitle" className="text-sm font-light">
              57%
            </Typography> */}
          </Flex>
        </Flex>
        <Flex direction={"row"} justify={"between"} align={"center"}>
          <Chip label="Images" icon={<Dot size={50} className="text-chart-2 " />} className="bg-opacity-0 " iconPosition="left" />

          <Flex gap={"2"}>
            <Typography variant="subtitle" className="text-sm font-medium text-black">
              {noOfImageAds}
            </Typography>
            {/* <Typography variant="subtitle" className="text-sm font-light">
              57%
            </Typography> */}
          </Flex>
        </Flex>
        <Flex direction={"row"} justify={"between"} align={"center"}>
          <Chip label="Carousel" icon={<Dot size={50} className="text-chart-3 " />} className="bg-opacity-0 " iconPosition="left" />

          <Flex gap={"2"}>
            <Typography variant="subtitle" className="text-sm font-medium text-black">
              {noOfGifAds}
            </Typography>
            {/* <Typography variant="subtitle" className="text-sm font-light">
              57%
            </Typography> */}
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
