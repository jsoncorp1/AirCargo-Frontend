"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircleIcon, TimeIcon, BoxCubeIcon } from "@/icons";

export default function EnvioEsporadicoPage() {
  return (
    <div className="bg-white min-h-screen pb-20">
      {/* BREADCRUMBS */}
      <div className="bg-gray-50 border-b border-gray-100 py-3">
        <div className="container mx-auto px-4 md:px-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-brand-600 transition-colors">Inicio</Link>
          <span className="mx-2">/</span>
          <span>Servicios</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-semibold">Envío Esporádico</span>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-gray-100">
            <Image 
              src="/images/3.jpg" 
              alt="Envío Esporádico" 
              fill 
              className="object-cover"
              priority
            />
          </div>
          
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Envío Esporádico
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Ideal para personas naturales o empresas que necesitan enviar paquetes de manera ocasional, sin necesidad de contratos corporativos ni volúmenes mínimos. Toda la calidad y rapidez de AirCargo al alcance de un solo envío.
            </p>
            
            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-4">
                <TimeIcon className="w-6 h-6 text-brand-600 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900">Rápido y Seguro</h4>
                  <p className="text-gray-600 text-sm">Entregas en 24-48 horas en el eje troncal.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <BoxCubeIcon className="w-6 h-6 text-brand-600 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900">Sin mínimos de envío</h4>
                  <p className="text-gray-600 text-sm">Envía 1 solo paquete o 10, cuando lo necesites.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircleIcon className="w-6 h-6 text-brand-600 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900">Seguimiento</h4>
                  <p className="text-gray-600 text-sm">Rastrea tu envío en todo momento.</p>
                </div>
              </div>
            </div>

            <Link 
              href="/contacto" 
              className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-10 rounded-xl text-center transition-colors shadow-lg shadow-brand-500/30 uppercase tracking-wide"
            >
              Cotizar un Envío
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
