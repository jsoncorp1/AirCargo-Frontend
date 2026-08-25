"use client";

import React, { useState } from "react";
import Image from "next/image";

export function HeroSection() {
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      alert(`Función de rastreo en desarrollo para: ${trackingNumber}`);
    }
  };

  return (
    <section className="relative w-full overflow-hidden">
      {/* La altura sigue al alto de ventana menos el header fijo (105px) y queda
          acotada entre 520 y 720. Así el recorte vertical es suave y la barra de
          navegación nunca corta el titular ni la cabeza del repartidor. */}
      <div className="relative h-[calc(100svh_-_105px)] min-h-[520px] max-h-[720px] w-full">
        <Image
          src="/images/aircargo_hero_premium5.png"
          alt="Repartidor de AirCargo Express con paquetes junto a la flota"
          fill
          sizes="100vw"
          priority
          // En móvil encuadra al repartidor; en desktop deja aire arriba para
          // que se lea el titular de la propia imagen.
          className="object-cover object-[68%_30%] md:object-[center_20%]"
        />

        {/* Degradado sólo hacia abajo: arriba la foto queda limpia y abajo
            gana contraste para el buscador. */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#040F21]/85 via-[#040F21]/25 to-transparent" />

        {/* Buscador anclado a la franja inferior, fuera del rostro del repartidor
            y por encima de las tarjetas flotantes. */}
        <div className="absolute inset-x-0 bottom-0 z-10 pb-28 md:pb-36">
          <form
            onSubmit={handleTrack}
            className="mx-auto w-full max-w-3xl px-4 text-center"
          >
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-white drop-shadow-lg md:mb-5 md:text-5xl">
              Rastree su envío
            </h1>

            <div className="flex flex-col gap-2 rounded-xl bg-white/95 p-2 shadow-2xl backdrop-blur-sm md:flex-row md:p-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Indica tu(s) número(s) de seguimiento"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full rounded-lg border border-transparent px-4 py-3.5 text-base text-gray-900 placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-0 md:py-4 md:text-lg"
                />
                {trackingNumber && (
                  <button
                    type="button"
                    onClick={() => setTrackingNumber("")}
                    aria-label="Limpiar"
                    className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 transition-colors hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="whitespace-nowrap rounded-lg bg-brand-600 px-8 py-3.5 text-base font-bold text-white transition-colors hover:bg-brand-700 md:py-4 md:text-lg"
              >
                Seguir envío
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
