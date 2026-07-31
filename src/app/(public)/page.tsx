"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BoxCubeIcon, TimeIcon, CheckCircleIcon } from "@/icons";

export default function HomePage() {
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber) {
      alert(`Función de rastreo en desarrollo para: ${trackingNumber}`);
    }
  };

  return (
    <div className="bg-white">
      {/* HERO SECTION - Original Modern Style */}
      <section className="relative min-h-[100vh] flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-cod.png"
            alt="Logística AirCargo"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d1b3e]/95 via-[#0d1b3e]/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 md:px-8 py-20">
          <div className="max-w-2xl animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl xl:text-[4.5rem] font-extrabold text-white leading-[1.05] mb-6 tracking-tight drop-shadow-md">
              Excelencia en <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-500">Entregas</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-200 leading-relaxed mb-10 max-w-xl font-light">
              <strong className="font-semibold text-white">AIRCARGO EXPRESS</strong> gestiona la distribución y cobranza de tus pedidos. Tu aliado estratégico para envíos corporativos y comercio electrónico en toda Bolivia.
            </p>

            {/* Tracking Widget */}
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 shadow-2xl mb-8">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <BoxCubeIcon className="w-5 h-5 text-brand-400" />
                Rastrear tu envío
              </h3>
              <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Ingresa tu número de guía"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="flex-1 px-4 py-3 rounded border border-white/30 bg-white/5 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 text-white placeholder-gray-300"
                />
                <button
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 px-8 rounded transition-colors uppercase tracking-wide text-sm whitespace-nowrap shadow-lg shadow-brand-500/30"
                >
                  Rastrear
                </button>
              </form>
            </div>
            
            <div className="flex gap-4">
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/20 hover:border-white text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 backdrop-blur-sm hover:bg-white/10"
              >
                Cotizar ahora →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* NUESTROS SERVICIOS */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Nuestros Servicios</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Soluciones logísticas diseñadas para hacer crecer tu negocio y garantizar la satisfacción de tus clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Contraentrega Card */}
            <Link href="/servicios/contraentrega" className="group">
              <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                <div className="relative h-64 overflow-hidden">
                  <Image src="/images/1.jpg" alt="Contraentrega" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-brand-600 font-bold px-3 py-1 rounded text-xs uppercase tracking-wider">
                    Servicio Estrella
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-brand-600 transition-colors">Servicio Contraentrega (COD)</h3>
                  <p className="text-gray-600 mb-6 flex-1">
                    Gestionamos la entrega y el cobro (efectivo o QR) en la puerta de tu cliente. Ideal para e-commerce. Disminuye riesgos y aumenta tus ventas.
                  </p>
                  <div className="text-brand-600 font-bold flex items-center gap-2 uppercase tracking-wide text-sm">
                    Saber más 
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Envío Esporádico Card */}
            <Link href="/servicios/envio-esporadico" className="group">
              <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                <div className="relative h-64 overflow-hidden">
                  <Image src="/images/3.jpg" alt="Envío Esporádico" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-brand-600 transition-colors">Envío Esporádico</h3>
                  <p className="text-gray-600 mb-6 flex-1">
                    Soluciones rápidas para envíos puntuales. Envía paquetes a nivel nacional con la seguridad y rapidez que nos caracteriza, sin contratos fijos.
                  </p>
                  <div className="text-brand-600 font-bold flex items-center gap-2 uppercase tracking-wide text-sm">
                    Saber más 
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">Por qué elegir AirCargo Express</h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Nuestra infraestructura está diseñada para ser el motor logístico de tu empresa. Entendemos que cada paquete entregado a tiempo es una promesa cumplida a tus clientes.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: "Cobertura Nacional", desc: "Llegamos a los principales mercados del país." },
                  { title: "Rapidez", desc: "Tiempos de entrega optimizados para el E-commerce." },
                  { title: "Seguridad Financiera", desc: "Liquidaciones transparentes y puntuales." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1">
                      <CheckCircleIcon className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{item.title}</h4>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[500px]">
              <Image src="/images/2.jpg" alt="Logística" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
