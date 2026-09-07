"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import {
  cashRegisterService,
  CashRegisterSession,
  CashRegisterSessionListItem,
  CarriedCashResponse,
  CashMovement,
  CashMovementKind,
  DailyCashCountResponse,
  QrSummaryGroupBy,
  QrSummaryResponse,
} from "@/services/cashRegisterService";
import { getApiErrorMessage } from "@/services/apiErrorMessages";
import { branchOfficeService, BranchOffice } from "@/services/branchOfficeService";
import { userService, User } from "@/services/userService";
import { formatDate, formatTime, todayApiDay } from "@/utils/datetime";
import { paymentMethodLabel } from "@/services/logisticsEnums";
import Pagination from "@/components/tables/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarLineIcon,
  PlusIcon,
  EyeIcon,
  AlertIcon,
  UserCircleIcon,
  PencilIcon,
  TrashBinIcon,
} from "@/icons";

/**
 * La caja de la sucursal: un solo cajón.
 *
 * Esta pantalla reemplaza a las dos que había —"Caja Mostrador" y "Caja
 * Chica"—, que modelaban como dos libros separados lo que en la sucursal
 * siempre fue la misma gaveta. El saldo es uno solo:
 *
 *     apertura + cobros en efectivo + ingresos − egresos
 *
 * El QR queda afuera a propósito: va directo al banco del jefe y no hay billete
 * que contar. Se muestra al costado y se reporta en su propia pestaña.
 */

interface CashRegisterViewProps {
  // true si lo visita el superadmin desde /caja. El superadmin no tiene
  // sucursal, así que no opera cajas: solo las consulta.
  isSuperAdmin?: boolean;
}

type MainTab = "current" | "history" | "daily" | "qr";

const money = (n: number | null | undefined): string =>
  n === null || n === undefined ? "—" : `Bs ${n.toFixed(2)}`;

/** El signo importa más que el color cuando se lee una columna de números. */
const signedMoney = (n: number): string =>
  `${n < 0 ? "−" : "+"} Bs ${Math.abs(n).toFixed(2)}`;

const parseAmount = (raw: string): number => {
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

/** Primer día del mes boliviano en curso, en `yyyy-MM-dd`. */
const firstOfCurrentMonth = (): string => `${todayApiDay().slice(0, 7)}-01`;

export default function CashRegisterView({ isSuperAdmin = false }: CashRegisterViewProps) {
  const { branchOfficeCode, branchOfficeCity } = useAuth();
  const { showToast } = useToast();

  // El superadmin no puede abrir ni cerrar cajas —no tiene sucursal—, y los
  // endpoints `current` y `carried` son de rol admin. Arranca en el historial.
  const [activeTab, setActiveTab] = useState<MainTab>("current");

  // ─── Caja de hoy ───────────────────────────────────────────────────────────
  const [session, setSession] = useState<CashRegisterSession | null>(null);
  const [carried, setCarried] = useState<CarriedCashResponse | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(true);

  // Apertura
  const [openingCash, setOpeningCash] = useState<string>("");
  const [openingNotes, setOpeningNotes] = useState<string>("");

  // Cierre
  const [countedCash, setCountedCash] = useState<string>("");
  const [closingNotes, setClosingNotes] = useState<string>("");

  // Movimiento
  const [movementKind, setMovementKind] = useState<CashMovementKind>("Expense");
  const [movementAmount, setMovementAmount] = useState<string>("");
  const [movementDescription, setMovementDescription] = useState<string>("");
  const [settledByDriverId, setSettledByDriverId] = useState<string>("");
  const [editingMovement, setEditingMovement] = useState<CashMovement | null>(null);
  const [deletingMovement, setDeletingMovement] = useState<CashMovement | null>(null);

  // Comprobantes
  const [receiptTarget, setReceiptTarget] = useState<CashMovement | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // ─── Historial ─────────────────────────────────────────────────────────────
  const [historySessions, setHistorySessions] = useState<CashRegisterSessionListItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [historyStatus, setHistoryStatus] = useState<string>("");
  const [inspected, setInspected] = useState<CashRegisterSession | null>(null);
  const [loadingInspected, setLoadingInspected] = useState(false);

  // ─── Arqueo por usuario ────────────────────────────────────────────────────
  const [dailyDate, setDailyDate] = useState<string>(todayApiDay());
  const [dailyUserId, setDailyUserId] = useState<string>("");
  const [daily, setDaily] = useState<DailyCashCountResponse | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);

  // ─── Reporte de QR ─────────────────────────────────────────────────────────
  const [qrGroupBy, setQrGroupBy] = useState<QrSummaryGroupBy>("Day");
  const [qrFrom, setQrFrom] = useState<string>(firstOfCurrentMonth());
  const [qrTo, setQrTo] = useState<string>(todayApiDay());
  const [qr, setQr] = useState<QrSummaryResponse | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  // ─── Catálogos ─────────────────────────────────────────────────────────────
  const [branches, setBranches] = useState<BranchOffice[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const movementModal = useModal();
  const closeModal = useModal();
  const receiptModal = useModal();
  const viewReceiptModal = useModal();
  const detailModal = useModal();
  const deleteModal = useModal();

  const HISTORY_PER_PAGE = 10;

  const branchLabel = useMemo(
    () => [branchOfficeCode, branchOfficeCity].filter(Boolean).join(" — "),
    [branchOfficeCode, branchOfficeCity]
  );

  // ─── Carga ─────────────────────────────────────────────────────────────────

  const loadCurrent = useCallback(async () => {
    setLoadingCurrent(true);
    try {
      if (isSuperAdmin) {
        // El superadmin no tiene sucursal, y `sessions/current` y
        // `sessions/carried` son de rol admin: le darían 403. Pero sí puede
        // listar cajas y pedir una por id, así que la caja abierta de la
        // sucursal elegida se busca por el listado y se pide su detalle —
        // que trae la misma forma completa, con movimientos y guías.
        setCarried(null);
        if (!branchFilter) {
          setSession(null);
          return;
        }
        const res = await cashRegisterService.getSessions(1, 1, {
          branchOfficeId: branchFilter,
          status: "Open",
        });
        const abierta = res.data[0];
        setSession(abierta ? await cashRegisterService.getSessionById(abierta.id) : null);
        return;
      }

      const open = await cashRegisterService.getCurrentSession();
      setSession(open);
      if (!open) {
        // Sin caja abierta hay que ofrecer abrirla, y para eso hace falta saber
        // cuánto dejó el cierre anterior.
        const c = await cashRegisterService.getCarriedCash();
        setCarried(c);
        setOpeningCash(c.carriedCash.toFixed(2));
        setOpeningNotes("");
      }
    } catch (err) {
      showToast("error", getApiErrorMessage(err, "No se pudo cargar el estado de la caja."));
    } finally {
      setLoadingCurrent(false);
    }
  }, [isSuperAdmin, branchFilter, showToast]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await cashRegisterService.getSessions(historyPage, HISTORY_PER_PAGE, {
        ...(branchFilter ? { branchOfficeId: branchFilter } : {}),
        ...(historyStatus ? { status: historyStatus as "Open" | "Closed" } : {}),
      });
      setHistorySessions(res.data);
      setHistoryTotalPages(res.totalPages);
    } catch (err) {
      showToast("error", getApiErrorMessage(err, "No se pudo cargar el historial de cajas."));
    } finally {
      setLoadingHistory(false);
    }
  }, [historyPage, branchFilter, historyStatus, showToast]);

  const loadDaily = useCallback(async () => {
    setLoadingDaily(true);
    try {
      setDaily(
        await cashRegisterService.getDailyCount({
          date: dailyDate,
          ...(dailyUserId ? { userId: dailyUserId } : {}),
        })
      );
    } catch (err) {
      setDaily(null);
      showToast("error", getApiErrorMessage(err, "No se pudo cargar el arqueo."));
    } finally {
      setLoadingDaily(false);
    }
  }, [dailyDate, dailyUserId, showToast]);

  const loadQr = useCallback(async () => {
    setLoadingQr(true);
    try {
      setQr(
        await cashRegisterService.getQrSummary({
          groupBy: qrGroupBy,
          dateFrom: qrFrom,
          dateTo: qrTo,
          ...(isSuperAdmin && branchFilter ? { branchOfficeId: branchFilter } : {}),
        })
      );
    } catch (err) {
      setQr(null);
      showToast("error", getApiErrorMessage(err, "No se pudo cargar el reporte de QR."));
    } finally {
      setLoadingQr(false);
    }
  }, [qrGroupBy, qrFrom, qrTo, isSuperAdmin, branchFilter, showToast]);

  useEffect(() => {
    loadCurrent();
  }, [loadCurrent]);

  useEffect(() => {
    if (activeTab === "history") loadHistory();
  }, [activeTab, loadHistory]);

  useEffect(() => {
    if (activeTab === "daily") loadDaily();
  }, [activeTab, loadDaily]);

  useEffect(() => {
    if (activeTab === "qr") loadQr();
  }, [activeTab, loadQr]);

  useEffect(() => {
    if (isSuperAdmin) {
      branchOfficeService.getBranchOffices(1, 100).then((r) => setBranches(r.data)).catch(console.error);
      userService.getUsers(1, 100).then((r) => setUsers(r.data)).catch(console.error);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    // Para las rendiciones hay que poder elegir el conductor. El backend valida
    // que el id sea de rol conductor (`cashregister.movement.driver.invalid`).
    userService
      .getUsers(1, 100)
      .then((r) =>
        setDrivers(r.data.filter((u) => (u.roleName ?? "").toLowerCase() === "conductor"))
      )
      .catch(console.error);
  }, []);

  // ─── Acciones ──────────────────────────────────────────────────────────────

  const openingAmount = parseAmount(openingCash);
  const openingDiff =
    carried && Number.isFinite(openingAmount) ? openingAmount - carried.carriedCash : 0;
  const openingNeedsNote = Math.abs(openingDiff) > 0.001;

  const handleOpen = async () => {
    if (!Number.isFinite(openingAmount) || openingAmount < 0) {
      showToast("error", "El monto de apertura no puede ser negativo.");
      return;
    }
    if (openingNeedsNote && !openingNotes.trim()) {
      showToast("error", "Explica por qué lo contado no coincide con lo que dejó el cierre anterior.");
      return;
    }
    setSubmitting(true);
    try {
      await cashRegisterService.openSession({
        openingCash: openingAmount,
        openingNotes: openingNotes.trim() || null,
      });
      showToast("success", "Caja abierta. Ya se pueden emitir guías.");
      await loadCurrent();
    } catch (err) {
      showToast("error", getApiErrorMessage(err, "No se pudo abrir la caja."));
    } finally {
      setSubmitting(false);
    }
  };

  const resetMovementForm = () => {
    setMovementKind("Expense");
    setMovementAmount("");
    setMovementDescription("");
    setSettledByDriverId("");
    setEditingMovement(null);
  };

  const startEditMovement = (m: CashMovement) => {
    setEditingMovement(m);
    setMovementKind(m.kind);
    setMovementAmount(String(m.amount));
    setMovementDescription(m.description);
    setSettledByDriverId(m.settledByDriverId ?? "");
    movementModal.openModal();
  };

  const handleSaveMovement = async () => {
    const amount = parseAmount(movementAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("error", "El monto del movimiento debe ser mayor a cero.");
      return;
    }
    if (!movementDescription.trim()) {
      showToast("error", "Debes ingresar una descripción para el movimiento.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        kind: movementKind,
        amount,
        description: movementDescription.trim(),
        // La referencia al conductor solo tiene sentido en un ingreso: es la
        // rendición de lo que cobró en la puerta.
        settledByDriverId:
          movementKind === "Income" && settledByDriverId ? settledByDriverId : null,
      };
      if (editingMovement) {
        await cashRegisterService.updateMovement(editingMovement.id, payload);
        showToast("success", "Movimiento actualizado.");
      } else {
        await cashRegisterService.createMovement(payload);
        showToast("success", "Movimiento registrado.");
      }
      movementModal.closeModal();
      resetMovementForm();
      await loadCurrent();
    } catch (err) {
      showToast("error", getApiErrorMessage(err, "No se pudo guardar el movimiento."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMovement = async () => {
    if (!deletingMovement) return;
    setSubmitting(true);
    try {
      await cashRegisterService.deleteMovement(deletingMovement.id);
      showToast("success", "Movimiento eliminado.");
      deleteModal.closeModal();
      setDeletingMovement(null);
      await loadCurrent();
    } catch (err) {
      showToast("error", getApiErrorMessage(err, "No se pudo eliminar el movimiento."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadReceipt = async () => {
    if (!receiptTarget || !receiptFile) return;
    setSubmitting(true);
    try {
      await cashRegisterService.uploadReceipt(receiptTarget.id, receiptFile);
      showToast("success", "Comprobante adjuntado.");
      receiptModal.closeModal();
      setReceiptTarget(null);
      setReceiptFile(null);
      await loadCurrent();
    } catch (err) {
      showToast("error", getApiErrorMessage(err, "No se pudo subir el comprobante."));
    } finally {
      setSubmitting(false);
    }
  };

  const counted = parseAmount(countedCash);
  const closingDiff = session && Number.isFinite(counted) ? counted - session.balance : 0;
  const closingNeedsNote = Math.abs(closingDiff) > 0.001;

  const handleClose = async () => {
    if (!session) return;
    if (!Number.isFinite(counted) || counted < 0) {
      showToast("error", "El monto contado no puede ser negativo.");
      return;
    }
    if (closingNeedsNote && !closingNotes.trim()) {
      showToast("error", "Explica el motivo de la diferencia antes de cerrar.");
      return;
    }
    setSubmitting(true);
    try {
      await cashRegisterService.closeSession(session.id, {
        countedCash: counted,
        closingNotes: closingNotes.trim() || null,
      });
      showToast("success", "Caja cerrada.");
      closeModal.closeModal();
      setCountedCash("");
      setClosingNotes("");
      await loadCurrent();
    } catch (err) {
      showToast("error", getApiErrorMessage(err, "No se pudo cerrar la caja."));
    } finally {
      setSubmitting(false);
    }
  };

  const inspect = async (id: string) => {
    setLoadingInspected(true);
    detailModal.openModal();
    try {
      setInspected(await cashRegisterService.getSessionById(id));
    } catch (err) {
      showToast("error", getApiErrorMessage(err, "No se pudo cargar la caja."));
      detailModal.closeModal();
    } finally {
      setLoadingInspected(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const tabs: { key: MainTab; label: string }[] = [
    { key: "current", label: "Caja de hoy" },
    { key: "history", label: "Historial" },
    { key: "daily", label: "Arqueo por usuario" },
    { key: "qr", label: "Cobrado por QR" },
  ];

  const tabClass = (active: boolean) =>
    `px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
      active
        ? "bg-brand-500 text-white shadow-sm"
        : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05]"
    }`;

  return (
    <div className="space-y-6">
      {/* Las dos formas de cobrar, que es donde se confunde la plata: el
          efectivo queda en la sucursal y el QR no. Los títulos nombran el
          ingreso porque es lo que la encargada está eligiendo al cobrar. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/[0.06]">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Ingreso en efectivo — en caja
          </p>
          <p className="mt-1 text-sm text-emerald-900/80 dark:text-emerald-200/80">
            Los billetes quedan en la sucursal y son lo único que se cuenta al cerrar.
            De la misma caja salen también los gastos y la plata que se le manda al jefe.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-500/20 dark:bg-blue-500/[0.06]">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Ingreso por QR — no en caja
          </p>
          <p className="mt-1 text-sm text-blue-900/80 dark:text-blue-200/80">
            Va directo al banco del jefe. Se registra y se reporta, pero no suma al saldo
            ni se cuenta contra los billetes.
          </p>
        </div>
      </div>

      {/* El superadmin no tiene cajón propio: elige de qué sucursal mira el de
          otro. La elección manda sobre las cuatro pestañas, no solo sobre una,
          para que no haya que repetirla en cada una. */}
      {isSuperAdmin && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Sucursal
          </label>
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setHistoryPage(1);
            }}
            className="min-w-[240px] rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">Elige una sucursal…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} — {b.city}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-400">
            {branchFilter
              ? "Solo consulta: no se abren ni cierran cajas ajenas."
              : "Sin sucursal elegida se ven todas las cajas en el historial."}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={tabClass(activeTab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ───────────────── CAJA DE HOY ───────────────── */}
      {activeTab === "current" && (
        <>
          {loadingCurrent ? (
            <div className="py-16 text-center text-sm text-gray-500">Cargando el estado de la caja…</div>
          ) : isSuperAdmin && !branchFilter ? (
            <ComponentCard title="Caja de hoy">
              <div className="py-14 text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Elige una sucursal arriba para ver su caja.
                </p>
                <p className="mx-auto mt-1.5 max-w-md text-sm text-gray-400">
                  No tienes sucursal propia, así que no hay una caja &laquo;tuya&raquo; que mostrar.
                </p>
              </div>
            </ComponentCard>
          ) : isSuperAdmin && !session ? (
            <ComponentCard title="Caja de hoy">
              <div className="py-14 text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Esa sucursal no tiene una caja abierta ahora.
                </p>
                <p className="mx-auto mt-1.5 max-w-md text-sm text-gray-400">
                  Con la caja cerrada tampoco puede emitir guías. Sus cajas anteriores
                  están en <strong>Historial</strong>.
                </p>
              </div>
            </ComponentCard>
          ) : !session ? (
            /* ─── Apertura ─── */
            <ComponentCard title="Abrir la caja" desc={branchLabel || undefined}>
              <div className="mx-auto max-w-lg">
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/[0.07] dark:text-amber-200">
                  <strong className="font-semibold">La sucursal no está atendiendo.</strong> Sin
                  caja abierta no se puede emitir ninguna guía —tampoco fiadas—. Abrir la caja
                  es lo que declara que se empezó a atender.
                </div>

                {carried && (
                  <div className="mb-5 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Dejó el cierre anterior
                      </span>
                      <span className="font-mono text-lg font-bold text-gray-800 dark:text-white/90">
                        {money(carried.carriedCash)}
                      </span>
                    </div>
                    {carried.lastClosedDay ? (
                      <p className="mt-1 text-xs text-gray-400">
                        Cerrada el {formatDate(carried.lastClosedAt!)} por {carried.lastClosedBy}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-400">
                        Es la primera caja de esta sucursal.
                      </p>
                    )}
                  </div>
                )}

                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ¿Cuánto contaste en la caja?
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />

                {openingNeedsNote && (
                  <>
                    <div className="mt-4 flex items-center justify-between rounded-lg bg-error-50 px-4 py-2.5 dark:bg-error-500/10">
                      <span className="text-sm font-medium text-error-700 dark:text-error-400">
                        Diferencia contra lo arrastrado
                      </span>
                      <span className="font-mono font-bold text-error-700 dark:text-error-400">
                        {signedMoney(openingDiff)}
                      </span>
                    </div>
                    <label className="mt-4 mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      ¿Por qué no coincide? <span className="text-error-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={openingNotes}
                      onChange={(e) => setOpeningNotes(e.target.value)}
                      maxLength={300}
                      placeholder="Ej.: faltaban 10 Bs al abrir, se avisa al jefe"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Queda registrado: es plata que apareció o desapareció entre turnos.
                    </p>
                  </>
                )}

                <button
                  onClick={handleOpen}
                  disabled={submitting}
                  className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? "Abriendo…" : "Abrir caja"}
                </button>
              </div>
            </ComponentCard>
          ) : (
            /* ─── Caja abierta ─── */
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border-2 border-emerald-500/30 bg-white p-6 dark:bg-white/[0.03] lg:col-span-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Saldo en caja
                  </p>
                  <p className="mt-2 font-mono text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                    {money(session.balance)}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {isSuperAdmin ? `${session.branchOfficeCode} — ${session.branchOfficeCity}` : "Es lo que tiene que haber en billetes."}
                  </p>
                  {!isSuperAdmin && (
                    <button
                      onClick={() => {
                        setCountedCash("");
                        setClosingNotes("");
                        closeModal.openModal();
                      }}
                      className="mt-5 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]"
                    >
                      Cerrar caja
                    </button>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2">
                  <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Cómo se llegó a ese saldo
                  </p>
                  <dl className="space-y-2.5 font-mono text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">Apertura</dt>
                      <dd className="font-semibold text-gray-800 dark:text-white/90">{money(session.openingCash)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">+ Cobrado en efectivo</dt>
                      <dd className="font-semibold text-emerald-600 dark:text-emerald-400">{money(session.collectedCash)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">+ Ingresos</dt>
                      <dd className="font-semibold text-emerald-600 dark:text-emerald-400">{money(session.movementsIncome)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">− Egresos</dt>
                      <dd className="font-semibold text-error-600 dark:text-error-400">{money(session.movementsExpense)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2.5 dark:border-gray-800">
                      <dt className="font-semibold text-gray-700 dark:text-gray-200">Saldo</dt>
                      <dd className="text-base font-bold text-gray-900 dark:text-white">{money(session.balance)}</dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-500/10">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                        Por QR (al banco)
                      </p>
                      <p className="text-xs text-blue-800/70 dark:text-blue-300/70">No entra en el saldo</p>
                    </div>
                    <span className="font-mono text-lg font-bold text-blue-700 dark:text-blue-400">
                      {money(session.expectedQr)}
                    </span>
                  </div>

                  {session.openingNotes && (
                    <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                      <strong>Apertura con diferencia ({signedMoney(session.openingDifference)}):</strong>{" "}
                      {session.openingNotes}
                    </p>
                  )}
                  <p className="mt-4 text-xs text-gray-400">
                    Abierta el {formatDate(session.openedAt)} a las {formatTime(session.openedAt)} por {session.openedBy}
                  </p>
                </div>
              </div>

              {/* ─── Movimientos ─── */}
              <ComponentCard
                title="Movimientos"
                desc="Gastos de la sucursal, plata que manda el jefe, rendiciones de conductores y remesas al jefe. Todo contra la misma caja."
              >
                {!isSuperAdmin && (
                  <div className="mb-4 flex justify-end">
                    <button
                      onClick={() => {
                        resetMovementForm();
                        movementModal.openModal();
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                    >
                      <PlusIcon className="size-4" /> Registrar movimiento
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                      <TableRow>
                        <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Hora</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Descripción</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Registró</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Monto</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Saldo</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Recibo</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {session.movements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                            Todavía no hay movimientos en esta caja.
                          </TableCell>
                        </TableRow>
                      ) : (
                        session.movements.map((m) => (
                          <TableRow key={m.id} className="border-b border-gray-50 dark:border-gray-800/60">
                            <TableCell className="px-4 py-3 text-sm text-gray-500">{formatTime(m.createdAt)}</TableCell>
                            <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {m.description}
                              {m.settledByDriverName && (
                                <span className="mt-0.5 block text-xs text-gray-400">
                                  Rendición de {m.settledByDriverName}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-xs text-gray-500">{m.registeredBy}</TableCell>
                            <TableCell
                              className={`px-4 py-3 text-right font-mono text-sm font-semibold ${
                                m.kind === "Income"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-error-600 dark:text-error-400"
                              }`}
                            >
                              {signedMoney(m.signedAmount)}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right font-mono text-sm text-gray-500">
                              {money(m.runningBalance)}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center">
                              {m.receiptUrl ? (
                                <button
                                  onClick={() => {
                                    setViewingReceiptUrl(m.receiptUrl);
                                    viewReceiptModal.openModal();
                                  }}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                                >
                                  <EyeIcon className="size-4" /> Ver
                                </button>
                              ) : m.canEdit ? (
                                <button
                                  onClick={() => {
                                    setReceiptTarget(m);
                                    setReceiptFile(null);
                                    receiptModal.openModal();
                                  }}
                                  className="text-xs font-medium text-gray-400 hover:text-brand-600"
                                >
                                  Adjuntar
                                </button>
                              ) : (
                                <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right">
                              {m.canEdit ? (
                                <div className="flex justify-end gap-1">
                                  <button
                                    onClick={() => startEditMovement(m)}
                                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10"
                                    title="Editar"
                                  >
                                    <PencilIcon className="size-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeletingMovement(m);
                                      deleteModal.openModal();
                                    }}
                                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10"
                                    title="Eliminar"
                                  >
                                    <TrashBinIcon className="size-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {session.movements.length > 0 && (
                  <p className="mt-3 text-xs text-gray-400">
                    La columna <strong>Saldo</strong> es cuánto había en la caja en el momento de
                    cada fila. Si después del último movimiento entraron cobros, esa última fila
                    queda por debajo del saldo de arriba: esa plata entró después.
                  </p>
                )}
              </ComponentCard>

              {/* ─── Guías cobradas ─── */}
              <ComponentCard
                title={`Guías cobradas (${session.shipmentCount})`}
                desc="Lo que entró por ventanilla durante esta caja."
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                      <TableRow>
                        <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Guía</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Cliente</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Medio</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Cobró</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Monto</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {session.shipments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                            Todavía no se cobró ninguna guía en esta caja.
                          </TableCell>
                        </TableRow>
                      ) : (
                        session.shipments.map((s) => (
                          <TableRow key={s.code} className="border-b border-gray-50 dark:border-gray-800/60">
                            <TableCell className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-300">{s.code}</TableCell>
                            <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{s.clientFullName}</TableCell>
                            <TableCell className="px-4 py-3">
                              <Badge size="sm" color={s.paymentMethod === "Cash" ? "success" : "info"}>
                                {paymentMethodLabel(s.paymentMethod)}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-xs text-gray-500">{s.collectedBy ?? "—"}</TableCell>
                            <TableCell className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-800 dark:text-white/90">
                              {money(s.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ComponentCard>

              {/* ─── Quién cobró cuánto ─── */}
              {session.byUser.length > 0 && (
                <ComponentCard title="Quién cobró cuánto" desc="Para repartir la diferencia si el arqueo no cuadra.">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {session.byUser.map((u) => (
                      <div key={u.userId} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                        <div className="mb-2 flex items-center gap-2">
                          <UserCircleIcon className="size-4 text-gray-400" />
                          <span className="truncate text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {u.collectedBy}
                          </span>
                        </div>
                        <div className="flex justify-between font-mono text-sm">
                          <span className="text-gray-500">Efectivo</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{money(u.cash)}</span>
                        </div>
                        <div className="flex justify-between font-mono text-sm">
                          <span className="text-gray-500">QR</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{money(u.qr)}</span>
                        </div>
                        <p className="mt-2 text-xs text-gray-400">{u.shipmentCount} guías</p>
                      </div>
                    ))}
                  </div>
                </ComponentCard>
              )}
            </>
          )}
        </>
      )}

      {/* ───────────────── HISTORIAL ───────────────── */}
      {activeTab === "history" && (
        <ComponentCard title="Cajas anteriores" desc="Cerrar es irreversible: no hay reabrir. Una caja cerrada por error se resuelve abriendo la siguiente.">
          <div className="mb-5 flex flex-wrap gap-3">
            <select
              value={historyStatus}
              onChange={(e) => {
                setHistoryStatus(e.target.value);
                setHistoryPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="">Todas</option>
              <option value="Open">Abiertas</option>
              <option value="Closed">Cerradas</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Día</TableCell>
                  {isSuperAdmin && <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Sucursal</TableCell>}
                  <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Apertura</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Saldo</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Contado</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Diferencia</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingHistory ? (
                  <TableRow>
                    <TableCell colSpan={isSuperAdmin ? 8 : 7} className="px-4 py-10 text-center text-sm text-gray-400">Cargando…</TableCell>
                  </TableRow>
                ) : historySessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isSuperAdmin ? 8 : 7} className="px-4 py-10 text-center text-sm text-gray-400">No hay cajas registradas.</TableCell>
                  </TableRow>
                ) : (
                  historySessions.map((s) => (
                    <TableRow key={s.id} className="border-b border-gray-50 dark:border-gray-800/60">
                      <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{s.openedDay}</TableCell>
                      {isSuperAdmin && <TableCell className="px-4 py-3 text-sm text-gray-500">{s.branchOfficeCode}</TableCell>}
                      <TableCell className="px-4 py-3">
                        <Badge size="sm" color={s.status === "Open" ? "success" : "light"}>
                          {s.status === "Open" ? "Abierta" : "Cerrada"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-mono text-sm text-gray-500">{money(s.openingCash)}</TableCell>
                      <TableCell className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-800 dark:text-white/90">{money(s.balance)}</TableCell>
                      <TableCell className="px-4 py-3 text-right font-mono text-sm text-gray-500">{money(s.countedCash)}</TableCell>
                      <TableCell className="px-4 py-3 text-right font-mono text-sm">
                        {s.difference === null ? (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        ) : Math.abs(s.difference) < 0.001 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">cuadró</span>
                        ) : (
                          <span className="font-semibold text-error-600 dark:text-error-400">{signedMoney(s.difference)}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <button
                          onClick={() => inspect(s.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                        >
                          <EyeIcon className="size-4" /> Ver
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {historyTotalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={historyPage} totalPages={historyTotalPages} onPageChange={setHistoryPage} />
            </div>
          )}
        </ComponentCard>
      )}

      {/* ───────────────── ARQUEO POR USUARIO ───────────────── */}
      {activeTab === "daily" && (
        <ComponentCard title="Arqueo por usuario" desc="Cuánto cobró una persona en un día. No es el arqueo de la caja: ese es de la sucursal y está en «Caja de hoy».">
          <div className="mb-5 flex flex-wrap gap-3">
            <input
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            {isSuperAdmin && (
              <select
                value={dailyUserId}
                onChange={(e) => setDailyUserId(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">Yo</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.email}</option>
                ))}
              </select>
            )}
          </div>

          {loadingDaily ? (
            <div className="py-12 text-center text-sm text-gray-400">Cargando…</div>
          ) : !daily ? (
            <div className="py-12 text-center text-sm text-gray-400">Sin datos para ese día.</div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Efectivo</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">{money(daily.cash)}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">QR</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-blue-600 dark:text-blue-400">{money(daily.qr)}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total · {daily.shipmentCount} guías</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-gray-800 dark:text-white/90">{money(daily.total)}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-400">{daily.collectedBy} · {daily.date}</p>
            </>
          )}
        </ComponentCard>
      )}

      {/* ───────────────── QR ───────────────── */}
      {activeTab === "qr" && (
        <ComponentCard
          title="Cobrado por QR"
          desc="Plata que entró al banco, no a la caja. Agrupada por día boliviano, para el cierre del contador."
        >
          <div className="mb-5 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Agrupar por</label>
              <select
                value={qrGroupBy}
                onChange={(e) => setQrGroupBy(e.target.value as QrSummaryGroupBy)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="Day">Día</option>
                <option value="Month">Mes</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Desde</label>
              <input
                type="date"
                value={qrFrom}
                onChange={(e) => setQrFrom(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Hasta</label>
              <input
                type="date"
                value={qrTo}
                onChange={(e) => setQrTo(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          </div>

          {loadingQr ? (
            <div className="py-12 text-center text-sm text-gray-400">Cargando…</div>
          ) : !qr || qr.data.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No hubo cobros por QR en ese rango.</div>
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-baseline gap-x-8 gap-y-2 rounded-xl bg-blue-50 px-5 py-4 dark:bg-blue-500/10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Total del rango</p>
                  <p className="font-mono text-2xl font-bold text-blue-700 dark:text-blue-400">{money(qr.total)}</p>
                </div>
                <p className="text-sm text-blue-800/70 dark:text-blue-300/70">
                  {qr.shipmentCount} guías · {qr.dateFrom} a {qr.dateTo}
                </p>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                    <TableRow>
                      <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {qrGroupBy === "Day" ? "Día" : "Mes"}
                      </TableCell>
                      <TableCell isHeader className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Sucursal</TableCell>
                      <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Guías</TableCell>
                      <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total QR</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qr.data.map((row) => (
                      <TableRow key={`${row.period}-${row.branchOfficeId}`} className="border-b border-gray-50 dark:border-gray-800/60">
                        <TableCell className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-300">{row.period}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">{row.branchOfficeCode}</TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm text-gray-500">{row.shipmentCount}</TableCell>
                        <TableCell className="px-4 py-3 text-right font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {money(row.totalQr)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </ComponentCard>
      )}

      {/* ═══════════ MODALES ═══════════ */}

      {/* Movimiento */}
      <Modal isOpen={movementModal.isOpen} onClose={movementModal.closeModal} className="z-50 m-4 max-w-[480px]">
        <div className="p-6">
          <h4 className="mb-1 text-lg font-bold text-gray-800 dark:text-white/90">
            {editingMovement ? "Editar movimiento" : "Registrar movimiento"}
          </h4>
          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
            Sale o entra de la misma caja que los cobros.
          </p>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setMovementKind("Expense")}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                movementKind === "Expense"
                  ? "border-error-500 bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400"
                  : "border-gray-200 text-gray-500 dark:border-gray-700"
              }`}
            >
              − Egreso
              <span className="mt-0.5 block text-xs font-normal opacity-70">gasto o remesa al jefe</span>
            </button>
            <button
              onClick={() => setMovementKind("Income")}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                movementKind === "Income"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "border-gray-200 text-gray-500 dark:border-gray-700"
              }`}
            >
              + Ingreso
              <span className="mt-0.5 block text-xs font-normal opacity-70">del jefe o rendición</span>
            </button>
          </div>

          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Monto</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={movementAmount}
            onChange={(e) => setMovementAmount(e.target.value)}
            className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />

          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
          <input
            type="text"
            maxLength={300}
            value={movementDescription}
            onChange={(e) => setMovementDescription(e.target.value)}
            placeholder={movementKind === "Expense" ? "Ej.: taxi al aeropuerto" : "Ej.: rendición COD del día"}
            className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />

          {movementKind === "Income" && (
            <>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                ¿Es una rendición de conductor? <span className="text-gray-400">(opcional)</span>
              </label>
              <select
                value={settledByDriverId}
                onChange={(e) => setSettledByDriverId(e.target.value)}
                className="mb-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">No — es plata del jefe</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.fullName} · {d.email}</option>
                ))}
              </select>
              <p className="mb-4 text-xs text-gray-400">
                Lo que el conductor cobró en la puerta entra a la caja recién cuando rinde.
              </p>
            </>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                movementModal.closeModal();
                resetMovementForm();
              }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveMovement}
              disabled={submitting}
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {submitting ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cerrar caja */}
      <Modal isOpen={closeModal.isOpen} onClose={closeModal.closeModal} className="z-50 m-4 max-w-[440px]">
        <div className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10">
            <AlertIcon className="size-6" />
          </div>
          <h4 className="mb-1 text-lg font-bold text-gray-800 dark:text-white/90">Cerrar la caja</h4>
          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
            Contá los billetes antes de escribir. <strong className="text-gray-700 dark:text-gray-300">No hay vuelta atrás:</strong>{" "}
            una caja cerrada no se puede reabrir, y sus guías quedan congeladas.
          </p>

          {session && (
            <>
              <div className="mb-4 flex items-baseline justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
                <span className="text-sm text-gray-500 dark:text-gray-400">Debería haber</span>
                <span className="font-mono text-xl font-bold text-gray-800 dark:text-white/90">{money(session.balance)}</span>
              </div>

              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">¿Cuánto contaste?</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />

              {countedCash !== "" && (
                <div
                  className={`mt-3 flex items-center justify-between rounded-lg px-4 py-2.5 ${
                    closingNeedsNote
                      ? "bg-error-50 dark:bg-error-500/10"
                      : "bg-emerald-50 dark:bg-emerald-500/10"
                  }`}
                >
                  <span className={`text-sm font-medium ${closingNeedsNote ? "text-error-700 dark:text-error-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                    {closingNeedsNote ? "Diferencia" : "Cuadra"}
                  </span>
                  <span className={`font-mono font-bold ${closingNeedsNote ? "text-error-700 dark:text-error-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                    {closingNeedsNote ? signedMoney(closingDiff) : "Bs 0.00"}
                  </span>
                </div>
              )}

              {closingNeedsNote && (
                <>
                  <label className="mt-4 mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ¿Por qué? <span className="text-error-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  />
                </>
              )}
            </>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={closeModal.closeModal}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleClose}
              disabled={submitting || countedCash === ""}
              className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {submitting ? "Cerrando…" : "Cerrar caja"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Adjuntar comprobante */}
      <Modal isOpen={receiptModal.isOpen} onClose={receiptModal.closeModal} className="z-50 m-4 max-w-[420px]">
        <div className="p-6">
          <h4 className="mb-1 text-lg font-bold text-gray-800 dark:text-white/90">Adjuntar comprobante</h4>
          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
            {receiptTarget?.description} · JPG, PNG o WEBP, hasta 10 MB.
          </p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={receiptModal.closeModal}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleUploadReceipt}
              disabled={submitting || !receiptFile}
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {submitting ? "Subiendo…" : "Subir"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Ver comprobante */}
      <Modal isOpen={viewReceiptModal.isOpen} onClose={viewReceiptModal.closeModal} className="z-50 m-4 max-w-[560px]">
        <div className="p-6">
          <h4 className="mb-4 text-lg font-bold text-gray-800 dark:text-white/90">Comprobante</h4>
          {viewingReceiptUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={viewingReceiptUrl} alt="Comprobante del movimiento" className="w-full rounded-xl" />
          )}
        </div>
      </Modal>

      {/* Eliminar movimiento */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.closeModal} className="z-50 m-4 max-w-[400px]">
        <div className="p-6">
          <h4 className="mb-1 text-lg font-bold text-gray-800 dark:text-white/90">Eliminar movimiento</h4>
          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
            {deletingMovement?.description} · {deletingMovement && signedMoney(deletingMovement.signedAmount)}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={deleteModal.closeModal}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteMovement}
              disabled={submitting}
              className="rounded-lg bg-error-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-error-700 disabled:opacity-50"
            >
              {submitting ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Detalle de una caja del historial */}
      <Modal isOpen={detailModal.isOpen} onClose={detailModal.closeModal} className="z-50 m-4 max-w-[720px]">
        <div className="max-h-[80vh] overflow-y-auto p-6">
          {loadingInspected ? (
            <div className="py-16 text-center text-sm text-gray-400">Cargando…</div>
          ) : inspected ? (
            <>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
                  <DollarLineIcon className="size-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                    Caja del {inspected.openedDay}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {inspected.branchOfficeCode} · abrió {inspected.openedBy}
                    {inspected.closedBy && ` · cerró ${inspected.closedBy}`}
                  </p>
                </div>
              </div>

              <dl className="mb-5 space-y-2 rounded-xl border border-gray-200 p-4 font-mono text-sm dark:border-gray-800">
                <div className="flex justify-between"><dt className="text-gray-500">Apertura</dt><dd>{money(inspected.openingCash)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">+ Cobrado en efectivo</dt><dd>{money(inspected.collectedCash)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">+ Ingresos</dt><dd>{money(inspected.movementsIncome)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">− Egresos</dt><dd>{money(inspected.movementsExpense)}</dd></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 font-bold dark:border-gray-800"><dt>Saldo</dt><dd>{money(inspected.balance)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Contado</dt><dd>{money(inspected.countedCash)}</dd></div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Diferencia</dt>
                  <dd className={inspected.difference && Math.abs(inspected.difference) > 0.001 ? "font-bold text-error-600" : "text-emerald-600"}>
                    {inspected.difference === null ? "—" : signedMoney(inspected.difference)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-800">
                  <dt className="text-blue-600 dark:text-blue-400">Por QR (al banco)</dt>
                  <dd className="text-blue-600 dark:text-blue-400">{money(inspected.expectedQr)}</dd>
                </div>
              </dl>

              {inspected.openingNotes && (
                <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                  <strong>Apertura:</strong> {inspected.openingNotes}
                </p>
              )}
              {inspected.closingNotes && (
                <p className="mb-3 rounded-lg bg-error-50 px-3 py-2 text-xs text-error-800 dark:bg-error-500/10 dark:text-error-300">
                  <strong>Cierre:</strong> {inspected.closingNotes}
                </p>
              )}

              {inspected.movements.length > 0 && (
                <>
                  <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Movimientos ({inspected.movementCount})
                  </p>
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {inspected.movements.map((m) => (
                      <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatTime(m.createdAt)} · {m.description}
                        </span>
                        <span className={`font-mono font-semibold ${m.kind === "Income" ? "text-emerald-600" : "text-error-600"}`}>
                          {signedMoney(m.signedAmount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
