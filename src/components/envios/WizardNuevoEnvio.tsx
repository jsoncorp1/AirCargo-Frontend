"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import SelectField from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import { empresaService } from "@/services/empresaService";
import { articuloService } from "@/services/articuloService";
import { conductorService } from "@/services/conductorService";
import { envioService } from "@/services/envioService";
import { Empresa } from "@/data/mock/empresas";
import { Articulo } from "@/data/mock/articulos";
import { Conductor } from "@/data/mock/conductores";

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface SelectedArticulo {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export default function WizardNuevoEnvio() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Data
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [articulosDisponibles, setArticulosDisponibles] = useState<Articulo[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);

  // Form State
  const [empresaId, setEmpresaId] = useState("");
  const [origen, setOrigen] = useState("");
  const [articulosSeleccionados, setArticulosSeleccionados] = useState<SelectedArticulo[]>([]);
  const [departamentoDestino, setDepartamentoDestino] = useState("");
  const [direccionDestino, setDireccionDestino] = useState("");
  const [conductorId, setConductorId] = useState("");

  // Cargar empresas al inicio
  useEffect(() => {
    empresaService.getEmpresas().then(data => setEmpresas(data.filter(e => e.estado === "Activo")));
  }, []);

  // Cargar artículos cuando se selecciona la empresa
  useEffect(() => {
    if (empresaId) {
      setLoading(true);
      const emp = empresas.find(e => e.id === empresaId);
      if (emp) setOrigen(emp.ciudad);

      articuloService.getArticulosByEmpresa(empresaId).then(data => {
        setArticulosDisponibles(data.filter(a => a.estado === "Activo" && a.stock > 0));
        setArticulosSeleccionados([]);
        setLoading(false);
      });
    }
  }, [empresaId, empresas]);

  // Cargar conductores disponibles en el paso 4
  useEffect(() => {
    if (step === 4) {
      setLoading(true);
      conductorService.getConductoresDisponibles().then(data => {
        setConductores(data);
        setLoading(false);
      });
    }
  }, [step]);

  const costoTotal = articulosSeleccionados.reduce((acc, curr) => acc + (curr.precioUnitario * curr.cantidad), 0) + 150; // 150 bs base de envío

  const handleNext = () => setStep(s => (s + 1) as WizardStep);
  const handlePrev = () => setStep(s => (s - 1) as WizardStep);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await envioService.createEnvio({
        empresaId,
        conductorId: conductorId || undefined,
        origen,
        departamentoDestino,
        direccionDestino,
        articulos: articulosSeleccionados.map(a => ({ articuloId: a.id, cantidad: a.cantidad })),
        costoTotal,
      });
      alert("¡Envío creado exitosamente!");
      router.push("/envios");
    } catch (error) {
      console.error(error);
      alert("Error al crear el envío");
      setSaving(false);
    }
  };

  const isStep1Valid = empresaId !== "";
  const isStep2Valid = articulosSeleccionados.length > 0;
  const isStep3Valid = departamentoDestino !== "" && direccionDestino.trim() !== "";
  const isStep4Valid = true; // Opcional asignar conductor ahora

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progreso */}
      <div className="mb-8 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <div className="flex items-center justify-between">
          {["Empresa", "Artículos", "Destino", "Conductor", "Resumen"].map((label, idx) => {
            const num = idx + 1;
            const isActive = step === num;
            const isCompleted = step > num;
            return (
              <div key={label} className="flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  isActive ? "bg-brand-500 text-white" : isCompleted ? "bg-success-500 text-white" : "bg-gray-100 text-gray-400 dark:bg-gray-700"
                }`}>
                  {isCompleted ? "✓" : num}
                </div>
                <span className={`mt-2 text-xs ${isActive ? "font-semibold text-gray-800 dark:text-white" : "text-gray-500"}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <ComponentCard title={`Paso ${step}`}>
        <div className="min-h-[300px] py-4">
          
          {/* PASO 1: EMPRESA */}
          {step === 1 && (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white/90">Seleccionar Empresa Proveedora</h3>
              <p className="text-sm text-gray-500">¿De qué proveedor es esta mercadería?</p>
              <SelectField
                placeholder="Seleccione una empresa"
                options={empresas.map(e => ({ value: e.id, label: `${e.nombre} (${e.ciudad})` }))}
                onChange={(val) => setEmpresaId(val)}
              />
            </div>
          )}

          {/* PASO 2: ARTICULOS */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white/90">Seleccionar Artículos</h3>
              {loading ? (
                <p>Cargando artículos...</p>
              ) : articulosDisponibles.length === 0 ? (
                <p className="text-error-500">Esta empresa no tiene artículos activos en stock.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {articulosDisponibles.map(art => {
                    const selected = articulosSeleccionados.find(a => a.id === art.id);
                    return (
                      <div key={art.id} className={`rounded-xl border p-4 ${selected ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10" : "border-gray-200 dark:border-gray-700"}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white">{art.nombre}</p>
                            <p className="text-xs text-gray-500">SKU: {art.sku} | Stock: {art.stock}</p>
                          </div>
                          <p className="font-semibold text-brand-500">Bs {art.precio}</p>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          {selected ? (
                            <>
                              <input 
                                type="number" 
                                min="1" 
                                max={art.stock}
                                value={selected.cantidad}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  setArticulosSeleccionados(prev => prev.map(p => p.id === art.id ? { ...p, cantidad: Math.min(val, art.stock) } : p));
                                }}
                                className="w-20 rounded-lg border border-gray-300 px-3 py-1 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                              />
                              <button 
                                onClick={() => setArticulosSeleccionados(prev => prev.filter(p => p.id !== art.id))}
                                className="text-error-500 text-sm hover:underline"
                              >
                                Quitar
                              </button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setArticulosSeleccionados(prev => [...prev, { id: art.id, nombre: art.nombre, precioUnitario: art.precio, cantidad: 1 }])}>
                              Agregar al envío
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* PASO 3: DESTINO */}
          {step === 3 && (
            <div className="space-y-5 max-w-lg">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white/90">Destino del Envío</h3>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Departamento</label>
                <SelectField
                  placeholder="Seleccione el departamento"
                  options={["La Paz", "Cochabamba", "Santa Cruz", "Oruro", "Potosí", "Tarija", "Chuquisaca", "Beni", "Pando"].map(d => ({ value: d, label: d }))}
                  onChange={(val) => setDepartamentoDestino(val)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección Exacta</label>
                <Input
                  placeholder="Ej. Av. Banzer Km 2.5, Galpón 4"
                  defaultValue={direccionDestino}
                  onChange={(e) => setDireccionDestino(e.target.value)}
                />
              </div>
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mt-4">
                <p className="text-sm text-gray-500">El envío saldrá desde: <strong className="text-gray-800 dark:text-white">{origen}</strong></p>
              </div>
            </div>
          )}

          {/* PASO 4: CONDUCTOR */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white/90">Asignar Conductor (Opcional)</h3>
              <p className="text-sm text-gray-500">Puedes asignar un conductor ahora o dejar el envío pendiente en la bolsa de trabajo.</p>
              
              {loading ? (
                <p>Cargando conductores disponibles...</p>
              ) : conductores.length === 0 ? (
                <p className="text-warning-500">No hay conductores disponibles en este momento.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div 
                    className={`cursor-pointer rounded-xl border p-4 ${conductorId === "" ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                    onClick={() => setConductorId("")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">?</div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">Asignar más tarde</p>
                        <p className="text-xs text-gray-500">Quedará en estado Pendiente</p>
                      </div>
                    </div>
                  </div>
                  {conductores.map(c => (
                    <div 
                      key={c.id} 
                      className={`cursor-pointer rounded-xl border p-4 ${conductorId === c.id ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                      onClick={() => setConductorId(c.id)}
                    >
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                           {c.nombre.charAt(0)}
                         </div>
                         <div>
                           <p className="font-medium text-gray-800 dark:text-white">{c.nombre}</p>
                           <p className="text-xs text-gray-500">{c.tipoVehiculo} - {c.placaVehiculo}</p>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PASO 5: RESUMEN */}
          {step === 5 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">Resumen del Envío</h3>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
                   <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Detalles de Ruta</h4>
                   <div className="space-y-3 text-sm">
                     <p><span className="text-gray-500">Empresa:</span> <span className="font-medium text-gray-800 dark:text-white">{empresas.find(e => e.id === empresaId)?.nombre}</span></p>
                     <p><span className="text-gray-500">Origen:</span> <span className="font-medium text-gray-800 dark:text-white">{origen}</span></p>
                     <p><span className="text-gray-500">Destino:</span> <span className="font-medium text-gray-800 dark:text-white">{departamentoDestino}</span></p>
                     <p><span className="text-gray-500">Dirección:</span> <span className="font-medium text-gray-800 dark:text-white">{direccionDestino}</span></p>
                     <p><span className="text-gray-500">Conductor:</span> <span className="font-medium text-gray-800 dark:text-white">{conductorId ? conductores.find(c => c.id === conductorId)?.nombre : "Asignación pendiente"}</span></p>
                   </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
                   <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Carga y Costos</h4>
                   <ul className="space-y-2 mb-4">
                     {articulosSeleccionados.map(a => (
                       <li key={a.id} className="flex justify-between text-sm">
                         <span className="text-gray-700 dark:text-gray-300">{a.cantidad}x {a.nombre}</span>
                         <span className="font-medium text-gray-800 dark:text-white">Bs {a.precioUnitario * a.cantidad}</span>
                       </li>
                     ))}
                   </ul>
                   <div className="flex justify-between border-t border-gray-200 pt-3 text-sm dark:border-gray-700">
                     <span className="text-gray-500">Costo Base de Envío</span>
                     <span className="font-medium text-gray-800 dark:text-white">Bs 150</span>
                   </div>
                   <div className="flex justify-between border-t border-gray-200 pt-3 mt-3 text-lg font-bold text-brand-600 dark:border-gray-700">
                     <span>Total Estimado</span>
                     <span>Bs {costoTotal}</span>
                   </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ACCIONES */}
        <div className="flex justify-between border-t border-gray-100 pt-4 mt-6 dark:border-gray-800">
          <Button variant="outline" onClick={step === 1 ? () => router.push("/envios") : handlePrev}>
            {step === 1 ? "Cancelar" : "Atrás"}
          </Button>
          
          {step === 1 && <Button onClick={handleNext} disabled={!isStep1Valid}>Siguiente</Button>}
          {step === 2 && <Button onClick={handleNext} disabled={!isStep2Valid}>Siguiente</Button>}
          {step === 3 && <Button onClick={handleNext} disabled={!isStep3Valid}>Siguiente</Button>}
          {step === 4 && <Button onClick={handleNext} disabled={!isStep4Valid}>Ver Resumen</Button>}
          {step === 5 && <Button onClick={handleSubmit} disabled={saving}>{saving ? "Guardando..." : "Confirmar Envío"}</Button>}
        </div>
      </ComponentCard>
    </div>
  );
}
