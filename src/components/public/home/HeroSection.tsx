"use client";

import React, { useState } from "react";
import Image from "next/image";

export function HeroSection() {
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber) {
      alert(`Función de rastreo en desarrollo para: ${trackingNumber}`);
    }
  };

  return (
    <section className="relative w-full min-h-[700px] h-[55vh] lg:h-[70vh] max-h-[900px] flex items-center justify-center overflow-visible">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/aircargo_hero_premium5.png"
          alt="AirCargo Trabajador Logística"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Un gradiente oscuro suave para que el texto resalte siempre */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Rastreador Centrado */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center transform -translate-y-12">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-md tracking-tight">
          Rastree su Envío
        </h1>

        <div className="bg-white rounded-lg shadow-2xl p-2 md:p-3 max-w-3xl mx-auto flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Indica tu(s) número(s) de seguimiento"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full px-4 py-4 md:py-5 text-gray-900 placeholder-gray-500 text-lg md:text-xl border border-transparent focus:border-transparent focus:ring-0 rounded-lg"
            />
            {trackingNumber && (
              <button
                type="button"
                onClick={() => setTrackingNumber("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={handleTrack}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-8 rounded text-lg transition-colors whitespace-nowrap"
          >
            Seguir envío
          </button>
        </div>
      </div>
    </section>
  );
}
