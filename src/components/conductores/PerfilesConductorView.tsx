"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/Pagination";
import Tabs, { TabItem } from "@/components/ui/tabs/Tabs";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useAuth } from "@/context/AuthContext";
import {
  driverService,
  Driver,
  driverTypeLabel,
  driverTypeBadge,
  driverTypeUsesOnlineFlag,
} from "@/services/driverService";
import { vehicleTypeLabel, formatBs } from "@/services/logisticsEnums";
import { userService, User } from "@/services/userService";
import { ROLE_NAMES, normalizeRoleName } from "@/services/userScope";
import { formatDateTime } from "@/utils/datetime";
import PerfilConductorModal from "./PerfilConductorModal";

const DEFAULT_PER_PAGE = 10;
// Los conductores de una sucursal son pocos: una página alcanza para cruzarlos
// contra los perfiles y encontrar a los que todavía no tienen uno.
const USERS_BATCH = 200;

type Vista = "conPerfil" | "sinPerfil";

const headerClass =
  "px-5 py-3 text-start text-xs font-semibold uppercase text-gray-500 dark:text-gray-400";
const cellClass = "px-5 py-4 align-middle text-theme-sm text-gray-600 dark:text-gray-300";

/**
 * Perfiles de conductor: qué vehículo maneja cada uno y bajo qué modalidad.
 *
 * Es lo que habilita a una persona con rol conductor a recibir tareas. Sin
 * perfil el backend rechaza cualquier asignación con
 * `drivertask.driver.noprofile`, así que la pestaña "sin perfil" es una lista de
 * pendientes, no un listado más.
 */
export default function PerfilesConductorView() {
  const { isSuperAdminUser } = useAuth();
  const perfilModal = useModal();

  const [vista, setVista] = useState<Vista>("conPerfil");

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);

  // Todos los perfiles, para cruzar contra los usuarios conductor y saber a
  // quién le falta uno. Es una consulta aparte de la paginada de arriba.
  const [allDriverIds, setAllDriverIds] = useState<Set<string>>(new Set());
  const [conductorUsers, setConductorUsers] = useState<User[]>([]);

  const [target, setTarget] = useState<{
    driverUserId: string;
    driverName: string;
    profile: Driver | null;
  } | null>(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await driverService.getDrivers(page, perPage);
      setDrivers(res.data);
      setTotalPages(res.totalPages);
      setCount(res.count);
    } catch (err) {
      console.error("Error fetching driver profiles", err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  const fetchPending = useCallback(async () => {
    try {
      const [all, users] = await Promise.all([
        driverService.getDrivers(1, USERS_BATCH),
        userService.getUsers(1, USERS_BATCH),
      ]);
      setAllDriverIds(new Set(all.data.map((d) => d.driverUserId)));
      setConductorUsers(
        users.data.filter((u) => normalizeRoleName(u.roleName) === ROLE_NAMES.conductor)
      );
    } catch (err) {
      console.error("Error fetching pending driver profiles", err);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const pendientes = useMemo(
    () => conductorUsers.filter((u) => !allDriverIds.has(u.id)),
    [conductorUsers, allDriverIds]
  );

  const openPerfil = (driverUserId: string, driverName: string, profile: Driver | null) => {
    setTarget({ driverUserId, driverName, profile });
    perfilModal.openModal();
  };

  const handleSaved = () => {
    fetchDrivers();
    fetchPending();
  };

  const vistaTabs: TabItem[] = [
    { value: "conPerfil", label: "Con perfil", count: loading ? undefined : count },
    { value: "sinPerfil", label: "Sin perfil", count: pendientes.length },
  ];

  const rowOffset = (page - 1) * perPage;

  return (
    <div>
      <PageBreadcrumb pageTitle="Perfiles de Conductor" />
      <p className="-mt-3 mb-6 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
        Un conductor sin perfil cargado no puede recibir recojos ni entregas: el sistema no sabe
        con qué vehículo trabaja.
      </p>

      <ComponentCard>
        <div className="mb-5">
          <Tabs items={vistaTabs} value={vista} onChange={(v) => setVista(v as Vista)} />
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="max-w-full overflow-x-auto">
            {vista === "conPerfil" ? (
              <Table>
                <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Nro
                    </TableCell>
                    <TableCell isHeader className={headerClass}>Conductor</TableCell>
                    <TableCell isHeader className={headerClass}>Modalidad</TableCell>
                    <TableCell isHeader className={headerClass}>Vehículo</TableCell>
                    {isSuperAdminUser && (
                      <TableCell isHeader className={headerClass}>Sucursal</TableCell>
                    )}
                    <TableCell isHeader className={headerClass}>Disponibilidad</TableCell>
                    <TableCell isHeader className={headerClass}>{""}</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdminUser ? 7 : 6} className="px-5 py-10 text-center text-sm text-gray-500">
                        Cargando perfiles…
                      </TableCell>
                    </TableRow>
                  ) : drivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdminUser ? 7 : 6} className="px-5 py-10 text-center text-sm text-gray-500">
                        Todavía no hay perfiles cargados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    drivers.map((driver, index) => (
                      <TableRow
                        key={driver.driverUserId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/20"
                      >
                        <TableCell className="w-14 whitespace-nowrap px-5 py-4 text-right align-middle text-theme-sm tabular-nums text-gray-400">
                          {rowOffset + index + 1}
                        </TableCell>
                        <TableCell className="px-5 py-4 align-middle">
                          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {driver.fullName}
                          </p>
                          {driver.email && (
                            <p
                              className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400"
                              title={driver.email}
                            >
                              {driver.email}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4 align-middle">
                          <div className="flex flex-col items-start gap-1">
                            <Badge size="sm" color={driverTypeBadge(driver.driverType)}>
                              {driverTypeLabel(driver.driverType)}
                            </Badge>
                            {typeof driver.monthlySalary === "number" && (
                              <span className="text-xs tabular-nums text-gray-400">
                                {formatBs(driver.monthlySalary)} / mes
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={cellClass}>
                          <p>{vehicleTypeLabel(driver.vehicleType)}</p>
                          <p className="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                            {driver.plateNumber} · {driver.vehicleBrand} {driver.vehicleModel}
                          </p>
                        </TableCell>
                        {isSuperAdminUser && (
                          <TableCell className={cellClass}>
                            {driver.branchOfficeCode ?? "—"}
                          </TableCell>
                        )}
                        <TableCell className="px-5 py-4 align-middle">
                          <div className="flex flex-col items-start gap-1">
                            <Badge size="sm" color={driver.isAvailable ? "success" : "light"}>
                              {driver.isAvailable ? "Disponible" : "No disponible"}
                            </Badge>
                            {/* El "en línea" solo significa algo en un esporádico:
                                el de planta está siempre disponible. */}
                            {driverTypeUsesOnlineFlag(driver.driverType) &&
                              !driver.isOnline &&
                              driver.lastOnlineAt && (
                                <span className="whitespace-nowrap text-xs text-gray-400">
                                  Últ. conexión {formatDateTime(driver.lastOnlineAt)}
                                </span>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle">
                          <button
                            type="button"
                            onClick={() =>
                              openPerfil(driver.driverUserId, driver.fullName, driver)
                            }
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10"
                          >
                            Editar perfil
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Nro
                    </TableCell>
                    <TableCell isHeader className={headerClass}>Conductor</TableCell>
                    <TableCell isHeader className={headerClass}>Teléfono</TableCell>
                    {isSuperAdminUser && (
                      <TableCell isHeader className={headerClass}>Sucursal</TableCell>
                    )}
                    <TableCell isHeader className={headerClass}>{""}</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pendientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdminUser ? 5 : 4} className="px-5 py-10 text-center text-sm text-gray-500">
                        Todos los conductores tienen perfil cargado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendientes.map((user, index) => (
                      <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                        <TableCell className="w-14 whitespace-nowrap px-5 py-4 text-right align-middle text-theme-sm tabular-nums text-gray-400">
                          {index + 1}
                        </TableCell>
                        <TableCell className="px-5 py-4 align-middle">
                          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {user.fullName}
                          </p>
                          <p
                            className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400"
                            title={user.email}
                          >
                            {user.email}
                          </p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-5 py-4 align-middle">
                          {user.phoneNumber ? (
                            <a
                              href={`tel:${user.phoneNumber}`}
                              className="font-mono text-theme-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
                            >
                              {user.phoneNumber}
                            </a>
                          ) : (
                            <span className="text-theme-sm text-gray-400">—</span>
                          )}
                        </TableCell>
                        {isSuperAdminUser && (
                          <TableCell className={cellClass}>
                            {user.branchOfficeCode ?? "—"}
                          </TableCell>
                        )}
                        <TableCell className="whitespace-nowrap px-5 py-4 text-right align-middle">
                          <button
                            type="button"
                            onClick={() => openPerfil(user.id, user.fullName, null)}
                            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
                          >
                            Cargar perfil
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {vista === "conPerfil" && totalPages > 1 && (
          <div className="mt-4 flex justify-end">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              perPage={perPage}
              onPerPageChange={setPerPage}
            />
          </div>
        )}
      </ComponentCard>

      <Modal
        isOpen={perfilModal.isOpen}
        onClose={perfilModal.closeModal}
        className="m-4 max-w-[640px] z-50"
      >
        {perfilModal.isOpen && target && (
          <PerfilConductorModal
            key={target.driverUserId}
            driverUserId={target.driverUserId}
            driverName={target.driverName}
            profile={target.profile}
            onClose={perfilModal.closeModal}
            onSaved={handleSaved}
          />
        )}
      </Modal>
    </div>
  );
}
