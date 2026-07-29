"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import SelectField from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { shipmentService, CreateSporadicShipmentLineRequest, CreateSporadicShipmentRequest } from "@/services/shipmentService";
import { branchOfficeService, BranchOffice } from "@/services/branchOfficeService";
import { User, MapPin, Package, CheckCircle2, Plus, Trash2, CheckSquare, Square } from "lucide-react";

type WizardStep = 1 | 2 | 3 | 4;

export default function WizardNuevoEnvio() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const { pending: saving, run: runSubmit } = useSubmitLock();
  
  const [branchOffices, setBranchOffices] = useState<BranchOffice[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState<Partial<CreateSporadicShipmentRequest>>({
    senderFullName: "",
    senderPhone: "",
    senderAddress: "",
    destinationBranchOfficeId: "",
    destinationDepartment: "",
    clientFullName: "",
    clientPhone: "",
    clientAddress: "",
    deliveryType: "Standard",
    isExpress: false,
    packageCount: 1,
    packageDescription: "",
    lines: []
  });

  const [lines, setLines] = useState<CreateSporadicShipmentLineRequest[]>([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        const res = await branchOfficeService.getBranchOffices(1, 100);
        setBranchOffices(res.data.filter(b => b.active));
      } catch (err) {
        console.error("Error fetching branches", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, []);

  const totalCost = lines.reduce((acc, curr) => acc + curr.shippingCost, 0);
  const totalWeight = lines.reduce((acc, curr) => acc + curr.weight, 0);

  const handleNext = () => setStep(s => (s + 1) as WizardStep);
  const handlePrev = () => setStep(s => (s - 1) as WizardStep);

  const updateField = (field: keyof CreateSporadicShipmentRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addLine = () => {
    setLines([...lines, { articleName: "", quantity: 1, unitPrice: 0, weight: 1, shippingCost: 10 }]);
  };

  const updateLine = (index: number, field: keyof CreateSporadicShipmentLineRequest, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmit = () =>
    runSubmit(async () => {
      try {
        if (!formData.destinationBranchOfficeId) throw new Error("Debe seleccionar una sucursal destino");
        
        const payload: CreateSporadicShipmentRequest = {
          ...formData as CreateSporadicShipmentRequest,
          lines
        };

        await shipmentService.createSporadicShipment(payload);
        alert("¡Envío creado exitosamente!");
        router.push("/admin/envios");
      } catch (error: any) {
        console.error(error);
        alert(error.message || "Error al crear el envío");
      }
    });

  const isStep1Valid = formData.senderFullName && formData.senderPhone && formData.senderAddress;
  const isStep2Valid = formData.destinationBranchOfficeId && formData.clientFullName && formData.clientPhone && formData.clientAddress;
  const isStep3Valid = formData.packageCount && formData.packageCount > 0 && formData.packageDescription && lines.length > 0 && lines.every(l => l.articleName && l.weight > 0 && l.shippingCost >= 0);

  const steps = [
    { num: 1, label: "Remitente", icon: <User className="w-5 h-5" /> },
    { num: 2, label: "Destinatario", icon: <MapPin className="w-5 h-5" /> },
    { num: 3, label: "Carga", icon: <Package className="w-5 h-5" /> },
    { num: 4, label: "Resumen", icon: <CheckCircle2 className="w-5 h-5" /> }
  ];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progreso */}
      <div className="mb-8 rounded-2xl bg-white p-4 shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-gray-800">
        <div className="flex items-center justify-between px-2">
          {steps.map((s) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (
              <div key={s.num} className="flex flex-col items-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  isActive ? "bg-brand-500 text-white shadow-md shadow-brand-500/20" : isCompleted ? "bg-success-500 text-white" : "bg-gray-100 text-gray-400 dark:bg-gray-700"
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : s.icon}
                </div>
                <span className={`mt-2 text-xs font-semibold ${isActive ? "text-brand-600 dark:text-brand-400" : isCompleted ? "text-success-600 dark:text-success-400" : "text-gray-400"}`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <ComponentCard title={`Paso ${step}: ${steps[step-1].label}`}>
        <div className="min-h-[300px] py-4">
          
          {/* PASO 1: REMITENTE */}
          {step === 1 && (
            <div className="space-y-6 max-w-xl">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo del Remitente</label>
                <Input
                  placeholder="Ej. Juan Pérez"
                  value={formData.senderFullName || ""}
                  onChange={(e) => updateField("senderFullName", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                <Input
                  placeholder="Ej. 70012345"
                  value={formData.senderPhone || ""}
                  onChange={(e) => updateField("senderPhone", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección de Origen</label>
                <Input
                  placeholder="Ej. Calle Aroma 123"
                  value={formData.senderAddress || ""}
                  onChange={(e) => updateField("senderAddress", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* PASO 2: DESTINATARIO */}
          {step === 2 && (
            <div className="space-y-6 max-w-xl">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Sucursal Destino</label>
                {loading ? <p className="text-sm text-gray-500">Cargando sucursales...</p> : (
                  <SelectField
                    placeholder="Seleccione la sucursal de destino"
                    options={branchOffices.map(b => ({ value: b.id, label: `${b.code} - ${b.city}` }))}
                    onChange={(val) => {
                      updateField("destinationBranchOfficeId", val);
                      const branch = branchOffices.find(b => b.id === val);
                      if (branch) updateField("destinationDepartment", branch.bolivianDepartment);
                    }}
                  />
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Destinatario</label>
                <Input
                  placeholder="Ej. Maria Lopez"
                  value={formData.clientFullName || ""}
                  onChange={(e) => updateField("clientFullName", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono del Destinatario</label>
                <Input
                  placeholder="Ej. 70098765"
                  value={formData.clientPhone || ""}
                  onChange={(e) => updateField("clientPhone", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección Exacta de Entrega</label>
                <Input
                  placeholder="Ej. Av. Banzer Km 2.5, Galpón 4"
                  value={formData.clientAddress || ""}
                  onChange={(e) => updateField("clientAddress", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* PASO 3: CARGA */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad de Bultos</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.packageCount || 1}
                    onChange={(e) => updateField("packageCount", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Envío Express</label>
                  <div 
                    className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => updateField("isExpress", !formData.isExpress)}
                  >
                    {formData.isExpress ? <CheckSquare className="text-brand-500 w-5 h-5" /> : <Square className="text-gray-400 w-5 h-5" />}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Marcar como servicio Express</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción del Paquete</label>
                <Input
                  placeholder="Ej. Cajas con repuestos electrónicos"
                  value={formData.packageDescription || ""}
                  onChange={(e) => updateField("packageDescription", e.target.value)}
                />
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">Líneas de Carga</h4>
                  <Button variant="outline" size="sm" onClick={addLine} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Agregar Artículo
                  </Button>
                </div>
                
                {lines.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 border border-dashed border-gray-300 rounded-xl dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    No hay artículos agregados. Haz clic en "Agregar Artículo" para detallar la carga.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lines.map((line, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex-1 w-full">
                          <label className="mb-1 block text-xs font-medium text-gray-500">Artículo</label>
                          <Input 
                            placeholder="Nombre artículo" 
                            value={line.articleName} 
                            onChange={(e) => updateLine(idx, "articleName", e.target.value)}
                          />
                        </div>
                        <div className="w-full md:w-24">
                          <label className="mb-1 block text-xs font-medium text-gray-500">Cant.</label>
                          <Input 
                            type="number" min="1" value={line.quantity} 
                            onChange={(e) => updateLine(idx, "quantity", parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="w-full md:w-32">
                          <label className="mb-1 block text-xs font-medium text-gray-500">Peso (kg)</label>
                          <Input 
                            type="number" min="0.1" step={0.1} value={line.weight} 
                            onChange={(e) => updateLine(idx, "weight", parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="w-full md:w-32">
                          <label className="mb-1 block text-xs font-medium text-gray-500">Costo Envío</label>
                          <Input 
                            type="number" min="0" value={line.shippingCost} 
                            onChange={(e) => updateLine(idx, "shippingCost", parseFloat(e.target.value))}
                          />
                        </div>
                        <button 
                          onClick={() => removeLine(idx)}
                          className="h-11 w-11 flex items-center justify-center shrink-0 rounded-lg bg-error-50 text-error-500 hover:bg-error-100 transition-colors dark:bg-error-500/10"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    <div className="text-right pt-2 font-semibold text-gray-800 dark:text-white">
                      Peso Total: {totalWeight.toFixed(2)} kg | Costo Envío Total: Bs {totalCost.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 4: RESUMEN */}
          {step === 4 && (
            <div className="space-y-6">
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800/50 shadow-sm">
                   <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Detalles de Ruta</h4>
                   <div className="space-y-4 text-sm">
                     <div className="flex gap-3">
                       <User className="w-5 h-5 text-gray-400 shrink-0" />
                       <div>
                         <p className="text-xs text-gray-500 font-semibold uppercase">Remitente</p>
                         <p className="font-medium text-gray-800 dark:text-white">{formData.senderFullName}</p>
                         <p className="text-gray-500">{formData.senderPhone}</p>
                         <p className="text-gray-500">{formData.senderAddress}</p>
                       </div>
                     </div>
                     <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                       <MapPin className="w-5 h-5 text-brand-500 shrink-0" />
                       <div>
                         <p className="text-xs text-gray-500 font-semibold uppercase">Destinatario</p>
                         <p className="font-medium text-gray-800 dark:text-white">{formData.clientFullName}</p>
                         <p className="text-gray-500">{formData.clientPhone}</p>
                         <p className="text-gray-500">{formData.clientAddress}</p>
                         <p className="mt-1 font-semibold text-brand-600 dark:text-brand-400">Sucursal: {branchOffices.find(b => b.id === formData.destinationBranchOfficeId)?.code}</p>
                       </div>
                     </div>
                   </div>
                </div>

                <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-5 dark:border-brand-900/30 dark:bg-brand-500/5 shadow-sm">
                   <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Detalle de Carga</h4>
                   <ul className="space-y-3 mb-6">
                     {lines.map((l, idx) => (
                       <li key={idx} className="flex justify-between text-sm items-center border-b border-brand-100 dark:border-brand-900 pb-2 last:border-0 last:pb-0">
                         <span className="text-gray-700 dark:text-gray-300"><span className="font-semibold text-gray-800 dark:text-white">{l.quantity}x</span> {l.articleName} <span className="text-xs text-gray-500 ml-1">({l.weight}kg)</span></span>
                         <span className="font-medium text-gray-800 dark:text-white">Bs {l.shippingCost}</span>
                       </li>
                     ))}
                   </ul>
                   <div className="flex justify-between text-sm mb-2">
                     <span className="text-gray-500">Bultos Totales</span>
                     <span className="font-medium text-gray-800 dark:text-white">{formData.packageCount}</span>
                   </div>
                   {formData.isExpress && (
                     <div className="flex justify-between text-sm mb-2 text-brand-600 dark:text-brand-400 font-semibold">
                       <span>Servicio</span>
                       <span>Express</span>
                     </div>
                   )}
                   <div className="flex justify-between border-t border-brand-200 dark:border-brand-800 pt-3 mt-3 text-xl font-bold text-brand-600 dark:text-brand-400">
                     <span>Costo Total de Envío</span>
                     <span>Bs {totalCost.toFixed(2)}</span>
                   </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ACCIONES */}
        <div className="flex justify-between border-t border-gray-100 pt-6 mt-2 dark:border-gray-800">
          <Button variant="outline" onClick={step === 1 ? () => router.push("/admin/envios") : handlePrev}>
            {step === 1 ? "Cancelar" : "Atrás"}
          </Button>
          
          {step === 1 && <Button onClick={handleNext} disabled={!isStep1Valid}>Siguiente</Button>}
          {step === 2 && <Button onClick={handleNext} disabled={!isStep2Valid}>Siguiente</Button>}
          {step === 3 && <Button onClick={handleNext} disabled={!isStep3Valid}>Ver Resumen</Button>}
          {step === 4 && <Button onClick={handleSubmit} disabled={saving}>{saving ? "Guardando..." : "Confirmar Envío"}</Button>}
        </div>
      </ComponentCard>
    </div>
  );
}
