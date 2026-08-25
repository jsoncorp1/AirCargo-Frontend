import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import { templateNavGroups } from "./_components/templateNav";

export const metadata: Metadata = {
  title: "Plantilla TailAdmin | AirCargo",
  description:
    "Referencia de las pantallas y componentes originales de la plantilla TailAdmin.",
};

export default function PlantillaHome() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Plantilla TailAdmin
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
          Zona de referencia con el dashboard y los componentes originales de la
          plantilla, para ver qué hay disponible antes de escribir algo a mano.
          Vive bajo <code className="font-mono text-xs">/plantilla</code> y no
          interviene con las rutas ni el menú del sistema real.
        </p>
      </div>

      {/* Dashboard original de TailAdmin */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />
          <MonthlySalesChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div>
      </div>

      {/* Catálogo de pantallas */}
      <div className="flex flex-col gap-6">
        {templateNavGroups
          .filter((group) => group.title !== "General")
          .map((group) => (
            <div key={group.title}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-gray-400">
                {group.title}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item) => {
                  const cardClass =
                    "group flex gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-brand-500 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500";
                  const cardContent = (
                    <>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                        {item.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-gray-800 group-hover:text-brand-600 dark:text-white/90">
                          {item.name}
                          {item.external && (
                            <span className="ml-1 text-xs text-gray-400">↗</span>
                          )}
                        </span>
                        <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">
                          {item.description}
                        </span>
                      </span>
                    </>
                  );

                  return item.external ? (
                    <a
                      key={item.path}
                      href={item.path}
                      target="_blank"
                      rel="noreferrer"
                      className={cardClass}
                    >
                      {cardContent}
                    </a>
                  ) : (
                    <Link key={item.path} href={item.path} className={cardClass}>
                      {cardContent}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
