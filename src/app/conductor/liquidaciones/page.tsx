"use client";

import React, { useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { BoxCubeIcon, CheckCircleIcon } from "@/icons";

export default function ConductorLiquidacionesPage() {
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [montoRendido, setMontoRendido] = useState(0);

  const totalPorRendir = 1250.50; // Mock de envíos CashOnDelivery entregados no rendidos

  const handleSubirComprobante = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      setTimeout(() => {
        setComprobanteUrl(URL.createObjectURL(e.target.files![0]));
        setMontoRendido(totalPorRendir);
        setIsUploading(false);
      }, 1000);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Mis Liquidaciones" />

      <div className="mb-6">
        <p className="text-gray-500 text-sm dark:text-gray-400">
          Aquí puedes ver el dinero recaudado de los envíos "Por Pagar" (Cash On Delivery) que debes rendir a la administración.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Saldo Actual por Rendir</h4>
          <div className="flex items-center gap-4 bg-brand-50 dark:bg-brand-500/10 p-5 rounded-xl border border-brand-100 dark:border-brand-900/30 mb-6">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
              <span className="text-lg font-bold">Bs</span>
            </div>
            <div>
              <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Total Recaudado (Pendiente)</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {montoRendido >= totalPorRendir ? "0.00" : totalPorRendir.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            <p>Este saldo corresponde a <span className="font-semibold text-gray-800 dark:text-gray-200">15 envíos</span> entregados y cobrados al cliente.</p>
          </div>

          {montoRendido >= totalPorRendir ? (
            <div className="bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400 p-4 rounded-xl border border-success-200 dark:border-success-900/30 flex items-center gap-3">
              <CheckCircleIcon className="w-6 h-6" />
              <div>
                <p className="font-semibold">Comprobante enviado</p>
                <p className="text-xs">El administrador validará tu pago pronto.</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Subir comprobante de depósito / QR</p>
              <label className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isUploading ? 'bg-gray-50 border-gray-300 dark:bg-gray-800 dark:border-gray-700 opacity-70' : 'bg-gray-50 hover:bg-gray-100 border-gray-300 dark:bg-gray-800/40 dark:hover:bg-gray-800 dark:border-gray-600'}`}>
                {isUploading ? (
                  <span className="text-brand-500 text-sm font-medium">Subiendo archivo...</span>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Seleccionar imagen o PDF</span>
                    <span className="text-xs text-gray-500 mt-1">Sube el ticket del banco o captura de pantalla</span>
                  </>
                )}
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleSubirComprobante} disabled={isUploading} />
              </label>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Historial de Liquidaciones</h4>
          
          <div className="space-y-4">
            {[
              { date: "09 May 2024", amount: 850.00, status: "Aprobado", envios: 8 },
              { date: "02 May 2024", amount: 1200.00, status: "Aprobado", envios: 12 },
              { date: "25 Abr 2024", amount: 540.50, status: "Aprobado", envios: 5 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <BoxCubeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.date}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.envios} envíos rendidos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Bs {item.amount.toFixed(2)}</p>
                  <p className="text-xs text-success-600 dark:text-success-400 font-medium flex items-center gap-1 justify-end">
                    <CheckCircleIcon className="w-3 h-3" /> {item.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
