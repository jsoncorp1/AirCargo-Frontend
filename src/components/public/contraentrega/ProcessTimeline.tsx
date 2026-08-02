"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { BoxIconContraentrega, MapIcon, ShieldIcon, CashIcon } from "@/icons";

const CAROUSEL_IMAGES = [
  "/images/paso1-1.png",
  "/images/paso2-2.png",
  "/images/paso3-3.png",
  "/images/paso4-4.png",
];

export function ProcessTimeline() {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 bg-[#F5F7FA]">
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* LADO IZQUIERDO: Explicación y Línea de Tiempo */}
          <div>
            <h2 className="text-3xl font-bold text-[#040F21] mb-6">¿Qué es el servicio Contra Entrega?</h2>
            <p className="text-lg text-[#565A6B] mb-12 leading-relaxed">
              El servicio Contra Entrega permite que tus clientes paguen el producto únicamente cuando lo reciben en sus manos. Nosotros entregamos el paquete, cobramos el importe indicado y posteriormente realizamos la liquidación correspondiente.
            </p>

            <h3 className="text-xl font-bold text-[#040F21] mb-8">¿Cómo funciona?</h3>

            {/* Línea de tiempo horizontal / vertical híbrida */}
            <div className="relative mb-12">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#E7EAF0] lg:hidden"></div>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center relative gap-6 lg:gap-2">
                <div className="hidden lg:block absolute top-4 left-0 right-0 h-0.5 bg-[#E7EAF0] z-0"></div>

                {[
                  { label: 'Pedido' },
                  { label: 'Recolectamos' },
                  { label: 'Enviamos' },
                  { label: 'Cliente recibe' },
                  { label: 'Paga' },
                  { label: 'Liquidación' },
                ].map((step, idx) => (
                  <div key={idx} className="relative z-10 flex flex-row lg:flex-col items-center gap-4 lg:gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-[#040F21] text-white flex items-center justify-center font-bold text-sm shadow-md transition-transform group-hover:scale-110">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-bold text-[#040F21] text-left lg:text-center w-24">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/contacto" className="inline-block bg-[#040F21] hover:bg-[#2D3348] text-white font-bold py-4 px-8 rounded transition-colors text-lg shadow-sm">
              Solicitar servicio
            </Link>

            {/* Beneficios Compactos */}
            <div className="mt-12 pt-8 border-t border-[#E7EAF0]">
              <h3 className="text-lg font-bold text-[#040F21] mb-6">Beneficios del Servicio</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                <div className="flex gap-4">
                  <div className="bg-white w-12 h-12 rounded shadow-sm flex items-center justify-center flex-shrink-0">
                    <BoxIconContraentrega className="w-6 h-6 text-[#040F21]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#040F21] text-sm mb-1">Seguimiento en tiempo real</h4>
                    <p className="text-[#565A6B] text-xs">Conoce el estado exacto de tu paquete en todo momento.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-white w-12 h-12 rounded shadow-sm flex items-center justify-center flex-shrink-0">
                    <MapIcon className="w-6 h-6 text-[#040F21]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#040F21] text-sm mb-1">Cobertura Nacional</h4>
                    <p className="text-[#565A6B] text-xs">Llegamos a los 9 departamentos de Bolivia.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-white w-12 h-12 rounded shadow-sm flex items-center justify-center flex-shrink-0">
                    <ShieldIcon className="w-6 h-6 text-[#040F21]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#040F21] text-sm mb-1">Cobro seguro</h4>
                    <p className="text-[#565A6B] text-xs">Confirmación al momento en que el cliente recibe y paga.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-white w-12 h-12 rounded shadow-sm flex items-center justify-center flex-shrink-0">
                    <CashIcon className="w-6 h-6 text-[#040F21]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#040F21] text-sm mb-1">Liquidación Transparente</h4>
                    <p className="text-[#565A6B] text-xs">Tu dinero es depositado rápidamente con reportes.</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* LADO DERECHO: Carrusel de imágenes de pasos */}
          <div className="relative sticky top-32">
            <div className="aspect-[4/3] rounded bg-white overflow-hidden shadow-lg border border-[#E7EAF0] relative">
              {CAROUSEL_IMAGES.map((img, index) => (
                <Image
                  key={index}
                  src={img}
                  alt={`Paso ${index + 1}`}
                  fill
                  className={`object-cover transition-opacity duration-1000 ${activeImage === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                />
              ))}
            </div>
            <div className="flex justify-center gap-3 mt-6">
              {CAROUSEL_IMAGES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`w-3 h-3 rounded-full transition-all ${activeImage === index ? 'bg-[#FF7A00] w-6' : 'bg-[#D1D5DB]'}`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
