"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircleIcon } from "@/icons";

export function ContactForm() {
  const [formState, setFormState] = useState({
    compania: "",
    direccion: "",
    ciudad: "",
    pais: "Bolivia",
    nombreCompleto: "",
    correo: "",
    telefono: "",
    preguntas: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  if (isSuccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-16 px-8 animate-fade-in-up">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircleIcon className="w-12 h-12 text-green-500" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-4">¡Muchas gracias!</h3>
        <p className="text-gray-600 mb-3 max-w-sm mx-auto text-lg">
          Hemos recibido tu solicitud de asesoría.
        </p>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Un asesor especializado de <strong>AIRCARGO EXPRESS</strong> se comunicará contigo muy pronto.
        </p>
        <button
          onClick={() => { setIsSuccess(false); setFormState({ compania: "", direccion: "", ciudad: "", pais: "Bolivia", nombreCompleto: "", correo: "", telefono: "", preguntas: "" }); }}
          className="text-brand-600 font-semibold hover:bg-brand-50 px-6 py-2 rounded-full transition-colors"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  const inputClass = "w-full mt-2 px-4 py-3 rounded border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
  const reqClass = "text-brand-600 ml-1";

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 md:p-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Formulario de Contacto</h2>
        <p className="text-gray-500 text-sm">Todos los campos marcados con asterisco (<span className={reqClass}>*</span>) son obligatorios</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* COLUMNA IZQUIERDA */}
          <div className="space-y-5">
            <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider border-b pb-2 mb-4">Datos de la empresa</h4>

            <div>
              <label className={labelClass}>Nombre de la Compañía <span className={reqClass}>*</span></label>
              <input className={inputClass} type="text" name="compania" value={formState.compania} onChange={handleChange} required />
            </div>

            <div>
              <label className={labelClass}>Dirección de la compañía <span className={reqClass}>*</span></label>
              <input className={inputClass} type="text" name="direccion" value={formState.direccion} onChange={handleChange} required />
            </div>

            <div>
              <label className={labelClass}>Ciudad <span className={reqClass}>*</span></label>
              <select className={inputClass} name="ciudad" value={formState.ciudad} onChange={handleChange} required>
                <option value="" disabled>Seleccionar...</option>
                <option value="Santa Cruz">Santa Cruz</option>
                <option value="La Paz">La Paz</option>
                <option value="Cochabamba">Cochabamba</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>País <span className={reqClass}>*</span></label>
              <div className="relative">
                <input className={`${inputClass} bg-gray-50 pl-10 cursor-not-allowed`} type="text" name="pais" value="Bolivia" disabled />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xl mt-1">🇧🇴</div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 mt-1">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="space-y-5">
            <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider border-b pb-2 mb-4">Persona de contacto</h4>

            <div>
              <label className={labelClass}>Nombre completo <span className={reqClass}>*</span></label>
              <input className={inputClass} type="text" name="nombreCompleto" value={formState.nombreCompleto} onChange={handleChange} required />
            </div>

            <div>
              <label className={labelClass}>Correo electrónico <span className={reqClass}>*</span></label>
              <input className={inputClass} type="email" name="correo" value={formState.correo} onChange={handleChange} required placeholder="ejemplo@email.com" />
            </div>

            <div className="flex gap-4">
              <div className="w-1/3">
                <label className={labelClass}>Código</label>
                <select className={inputClass}>
                  <option>+591</option>
                </select>
              </div>
              <div className="w-2/3">
                <label className={labelClass}>Teléfono <span className={reqClass}>*</span></label>
                <input className={inputClass} type="tel" name="telefono" value={formState.telefono} onChange={handleChange} required placeholder="123 456 789" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Preguntas o comentarios</label>
              <textarea
                className={`${inputClass} resize-none h-28`}
                name="preguntas"
                value={formState.preguntas}
                onChange={handleChange}
                maxLength={200}
                placeholder="Escribe tus preguntas o comentarios aquí..."
              />
              <div className="text-right text-xs text-gray-400 mt-1">{formState.preguntas.length} / 200</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 border-t pt-8">
          <Link href="/" className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded transition-colors shadow-sm hover:bg-gray-50 text-center">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !formState.compania || !formState.direccion || !formState.ciudad || !formState.nombreCompleto || !formState.correo || !formState.telefono}
            className="w-full sm:w-auto px-6 sm:px-12 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded transition-colors shadow-md uppercase tracking-wide text-center"
          >
            {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
          </button>
        </div>
      </form>
    </div>
  );
}
