import React from "react";
import Image from "next/image";
import Link from "next/link";

export function ServicesSection() {
  return (
    <section className="py-16 bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Servicios Logísticos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Servicio Contraentrega */}
          <div className="bg-[#f8fafc] rounded-lg overflow-hidden border border-gray-200 flex flex-col group hover:shadow-lg transition-shadow">
            {/* Contenedor de Imagen con object-contain para que no se corte */}
            <div className="relative h-64 w-full bg-gray-100 p-4">
              <Image
                src="/images/2.jpg"
                alt="Servicio Contraentrega"
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-8 flex flex-col flex-1 bg-white">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Pago Contra Entrega (COD)</h3>
              <p className="text-gray-600 mb-6 text-base leading-relaxed flex-1">
                Gestionamos la entrega y el cobro en efectivo o QR en la puerta de tu cliente. Disminuye rechazos y aumenta tus ventas con total seguridad.
              </p>
              <Link
                href="/servicios/contraentrega"
                className="inline-flex items-center gap-2 text-brand-600 font-bold hover:text-brand-800 transition-colors uppercase text-sm"
              >
                Saber más
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
          </div>

          {/* Servicio Esporádico */}
          <div className="bg-[#f8fafc] rounded-lg overflow-hidden border border-gray-200 flex flex-col group hover:shadow-lg transition-shadow">
            {/* Contenedor de Imagen con object-contain para que no se corte */}
            <div className="relative h-64 w-full bg-gray-100 p-4">
              <Image
                src="/images/envio_esporadico_hero_real.png"
                alt="Envío Esporádico"
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-8 flex flex-col flex-1 bg-white">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Envío Esporádico</h3>
              <p className="text-gray-600 mb-6 text-base leading-relaxed flex-1">
                Soluciones rápidas para envíos puntuales. Envía paquetes a nivel nacional con la seguridad y rapidez de AirCargo Express, sin contratos fijos.
              </p>
              <Link
                href="/servicios/envio-esporadico"
                className="inline-flex items-center gap-2 text-brand-600 font-bold hover:text-brand-800 transition-colors uppercase text-sm"
              >
                Saber más
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
