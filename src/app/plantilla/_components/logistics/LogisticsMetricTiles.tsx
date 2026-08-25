import React from "react";
import Badge from "@/components/ui/badge/Badge";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxCubeIcon,
  BoxIconLine,
  CheckCircleIcon,
  DollarLineIcon,
  GroupIcon,
  TaskIcon,
} from "@/icons";

type Tile = {
  label: string;
  value: string;
  icon: React.ReactNode;
  delta?: { value: string; up: boolean };
};

const tiles: Tile[] = [
  {
    label: "Total Orders",
    value: "12,384",
    icon: <BoxIconLine className="size-6 text-gray-800 dark:text-white/90" />,
    delta: { value: "20%", up: true },
  },
  {
    label: "Orders in Transit",
    value: "728",
    icon: <BoxCubeIcon className="size-6 text-gray-800 dark:text-white/90" />,
    delta: { value: "20%", up: true },
  },
  {
    label: "Total Revenue",
    value: "$23,445,700",
    icon: <DollarLineIcon className="size-6 text-gray-800 dark:text-white/90" />,
    delta: { value: "5.4%", up: true },
  },
  {
    label: "Shipped Quantities",
    value: "9,258",
    icon: <TaskIcon className="size-6 text-gray-800 dark:text-white/90" />,
    delta: { value: "1.2%", up: false },
  },
  {
    label: "Delivery Vehicles",
    value: "29",
    icon: <GroupIcon className="size-6 text-gray-800 dark:text-white/90" />,
    delta: { value: "3.85%", up: true },
  },
  {
    label: "Total Deliveries",
    value: "70.5K",
    icon: (
      <CheckCircleIcon className="size-6 text-gray-800 dark:text-white/90" />
    ),
    delta: { value: "8.1%", up: true },
  },
];

export default function LogisticsMetricTiles() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 md:gap-6">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            {tile.icon}
          </div>

          <div className="mt-5 flex items-end justify-between">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {tile.label}
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {tile.value}
              </h4>
            </div>

            {tile.delta && (
              <Badge color={tile.delta.up ? "success" : "error"}>
                {tile.delta.up ? (
                  <ArrowUpIcon />
                ) : (
                  <ArrowDownIcon className="text-error-500" />
                )}
                {tile.delta.value}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
