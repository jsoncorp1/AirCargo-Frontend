"use client";

import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/Pagination";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { ChevronDownIcon } from "@/icons";

type DeliveryStatus = "Delivered" | "In Transit" | "Pending" | "Cancelled";

type Activity = {
  orderId: string;
  category: string;
  company: string;
  arrival: string;
  route: string;
  price: string;
  status: DeliveryStatus;
};

const activities: Activity[] = [
  {
    orderId: "#28745-01",
    category: "Furniture",
    company: "Maderas del Sur",
    arrival: "14 Ago, 09:30",
    route: "Rosario → Córdoba",
    price: "$1,240.00",
    status: "Delivered",
  },
  {
    orderId: "#28745-02",
    category: "Clothing",
    company: "Textil Andina",
    arrival: "14 Ago, 11:00",
    route: "Buenos Aires → Mendoza",
    price: "$860.50",
    status: "In Transit",
  },
  {
    orderId: "#28745-03",
    category: "Books",
    company: "Editorial Norte",
    arrival: "14 Ago, 13:45",
    route: "Córdoba → Salta",
    price: "$310.00",
    status: "Pending",
  },
  {
    orderId: "#28745-04",
    category: "Automotive",
    company: "Repuestos Fénix",
    arrival: "15 Ago, 08:15",
    route: "Rosario → Tucumán",
    price: "$4,520.75",
    status: "Delivered",
  },
  {
    orderId: "#28745-05",
    category: "Electronics",
    company: "TecnoImport",
    arrival: "15 Ago, 10:20",
    route: "Buenos Aires → Neuquén",
    price: "$7,980.00",
    status: "In Transit",
  },
  {
    orderId: "#28745-06",
    category: "Food",
    company: "Distribuidora Pampa",
    arrival: "15 Ago, 16:00",
    route: "Santa Fe → Resistencia",
    price: "$1,145.20",
    status: "Cancelled",
  },
  {
    orderId: "#28745-07",
    category: "Pharma",
    company: "Farmacéutica Rioja",
    arrival: "16 Ago, 07:40",
    route: "Córdoba → La Rioja",
    price: "$2,300.00",
    status: "Delivered",
  },
  {
    orderId: "#28745-08",
    category: "Furniture",
    company: "Hogar & Diseño",
    arrival: "16 Ago, 12:10",
    route: "Rosario → Bahía Blanca",
    price: "$980.00",
    status: "Pending",
  },
  {
    orderId: "#28745-09",
    category: "Electronics",
    company: "MicroPartes SA",
    arrival: "16 Ago, 18:25",
    route: "Buenos Aires → Posadas",
    price: "$5,410.90",
    status: "In Transit",
  },
  {
    orderId: "#28745-10",
    category: "Clothing",
    company: "Indumentaria Litoral",
    arrival: "17 Ago, 09:00",
    route: "Santa Fe → Corrientes",
    price: "$640.00",
    status: "Delivered",
  },
];

const statusColor: Record<
  DeliveryStatus,
  "success" | "info" | "warning" | "error"
> = {
  Delivered: "success",
  "In Transit": "info",
  Pending: "warning",
  Cancelled: "error",
};

const filters: Array<DeliveryStatus | "All"> = [
  "All",
  "Delivered",
  "In Transit",
  "Pending",
  "Cancelled",
];

const PER_PAGE = 5;

export default function DeliveryActivitiesTable() {
  const [filter, setFilter] = useState<DeliveryStatus | "All">("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filtered = useMemo(
    () =>
      filter === "All"
        ? activities
        : activities.filter((activity) => activity.status === filter),
    [filter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  // Si el filtro achica el listado, no dejamos la página fuera de rango.
  const page = Math.min(currentPage, totalPages);
  const start = (page - 1) * PER_PAGE;
  const rows = filtered.slice(start, start + PER_PAGE);

  const applyFilter = (value: DeliveryStatus | "All") => {
    setFilter(value);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Delivery Activities
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Últimos movimientos de la flota
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="dropdown-toggle flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
          >
            {filter === "All" ? "Todos los estados" : filter}
            <ChevronDownIcon className="size-4" />
          </button>

          <Dropdown
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            className="w-48 p-2"
          >
            {filters.map((option) => (
              <DropdownItem
                key={option}
                onItemClick={() => applyFilter(option)}
                className={`rounded-lg dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 ${
                  filter === option ? "bg-gray-100 dark:bg-white/5" : ""
                }`}
              >
                {option === "All" ? "Todos los estados" : option}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
      </div>

      <div className="custom-scrollbar overflow-x-auto border-t border-gray-100 dark:border-gray-800">
        <div className="min-w-[900px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                {[
                  "Order ID",
                  "Category",
                  "Company",
                  "Arrival",
                  "Route",
                  "Price",
                  "Status",
                ].map((heading) => (
                  <TableCell
                    key={heading}
                    isHeader
                    className={`px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 ${
                      heading === "Price" ? "text-right" : "text-left"
                    }`}
                  >
                    {heading}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((activity) => (
                <TableRow key={activity.orderId}>
                  <TableCell className="px-5 py-4 font-mono text-theme-sm text-gray-800 dark:text-white/90">
                    {activity.orderId}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                    {activity.category}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {activity.company}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                    {activity.arrival}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                    {activity.route}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {activity.price}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge size="sm" color={statusColor[activity.status]}>
                      {activity.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}

              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-5 py-10 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                  >
                    No hay movimientos con ese estado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Mostrando {filtered.length === 0 ? 0 : start + 1}–
          {Math.min(start + PER_PAGE, filtered.length)} de {filtered.length}{" "}
          resultados
        </p>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
