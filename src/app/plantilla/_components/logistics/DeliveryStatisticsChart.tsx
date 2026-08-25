"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type Range = "monthly" | "yearly";

const dataByRange: Record<
  Range,
  { categories: string[]; shipment: number[]; delivery: number[] }
> = {
  monthly: {
    categories: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    shipment: [168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112],
    delivery: [140, 320, 175, 260, 160, 170, 250, 95, 190, 340, 240, 100],
  },
  yearly: {
    categories: ["2020", "2021", "2022", "2023", "2024", "2025"],
    shipment: [1820, 2140, 2680, 3120, 3495, 3860],
    delivery: [1610, 1980, 2410, 2870, 3180, 3520],
  },
};

export default function DeliveryStatisticsChart() {
  const [range, setRange] = useState<Range>("monthly");
  const data = dataByRange[range];

  const options: ApexOptions = {
    colors: ["#465fff", "#9cb9ff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 260,
      stacked: false,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: {
      categories: data.categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: { title: { text: undefined } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: false },
      y: { formatter: (val: number) => `${val}` },
    },
  };

  const series = [
    { name: "Shipment", data: data.shipment },
    { name: "Delivery", data: data.delivery },
  ];

  const tabClass = (value: Range) =>
    range === value
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Delivery Statistics
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Envíos despachados contra entregas concretadas.
          </p>
        </div>

        <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
          <button
            onClick={() => setRange("monthly")}
            className={`w-full rounded-md px-3 py-2 font-medium text-theme-sm hover:text-gray-900 dark:hover:text-white ${tabClass(
              "monthly"
            )}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setRange("yearly")}
            className={`w-full rounded-md px-3 py-2 font-medium text-theme-sm hover:text-gray-900 dark:hover:text-white ${tabClass(
              "yearly"
            )}`}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="custom-scrollbar max-w-full overflow-x-auto">
        <div className="min-w-[700px] pt-4">
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={260}
          />
        </div>
      </div>
    </div>
  );
}
