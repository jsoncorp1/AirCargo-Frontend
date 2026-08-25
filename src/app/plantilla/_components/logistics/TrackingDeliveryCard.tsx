import React from "react";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";

type Step = {
  title: string;
  detail: string;
  time: string;
  state: "done" | "current" | "pending";
};

const steps: Step[] = [
  {
    title: "Picked up",
    detail: "Warehouse Central, Rosario",
    time: "12 Ago · 08:40",
    state: "done",
  },
  {
    title: "In Transit",
    detail: "Terminal de cargas, Córdoba",
    time: "13 Ago · 15:12",
    state: "current",
  },
  {
    title: "Delivered",
    detail: "Av. Colón 1240, Córdoba",
    time: "Estimado 14 Ago",
    state: "pending",
  },
];

const dotClass = (state: Step["state"]) => {
  if (state === "done") return "bg-success-500 ring-success-100 dark:ring-success-500/20";
  if (state === "current") return "bg-brand-500 ring-brand-100 dark:ring-brand-500/20";
  return "bg-gray-300 ring-gray-100 dark:bg-gray-700 dark:ring-gray-800";
};

export default function TrackingDeliveryCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Tracking Delivery
          </h3>
          <p className="mt-1 font-mono text-sm text-gray-500 dark:text-gray-400">
            #28745-72809bjk
          </p>
        </div>
        <Badge color="info">In Transit</Badge>
      </div>

      {/* Courier */}
      <div className="mt-5 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/30">
        <div className="h-11 w-11 overflow-hidden rounded-full">
          <Image
            src="/images/user/user-01.jpg"
            alt="Courier"
            width={44}
            height={44}
            className="h-11 w-11 object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-800 dark:text-white/90">
            Devid Walthen
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Courier · Camión AB-482-JK
          </p>
        </div>
      </div>

      {/* Timeline */}
      <ol className="mt-6 space-y-0">
        {steps.map((step, index) => (
          <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
            {index < steps.length - 1 && (
              <span className="absolute left-[7px] top-5 h-full w-px bg-gray-200 dark:bg-gray-800" />
            )}
            <span
              className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ${dotClass(
                step.state
              )}`}
            />
            <div className="min-w-0">
              <p
                className={`font-medium ${
                  step.state === "pending"
                    ? "text-gray-400 dark:text-gray-500"
                    : "text-gray-800 dark:text-white/90"
                }`}
              >
                {step.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {step.detail}
              </p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                {step.time}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
