import React from "react";
import Image from "next/image";
import Link from "next/link";

export function HeroContraentrega() {
  return (
    <section className="relative pt-10 pb-16 md:pt-16 md:pb-20 lg:pt-24 lg:pb-28 overflow-hidden bg-white">
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 items-center">

          {/* Left: Text */}
          <div className="max-w-2xl text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black mb-4 md:mb-6 leading-tight text-[#040F21]">
              Vende por Internet y <span className="text-[#040F21]">cobra al entregar</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 md:mb-10 text-[#565A6B] font-light">
              Servicio Contra Entrega para empresas. Entregamos a tus clientes en todo Bolivia y liquidamos tu dinero de forma rápida y segura.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link href="/contacto" className="bg-[#FF7A00] hover:bg-[#E06C00] text-white font-bold py-3 md:py-4 px-6 md:px-8 rounded transition-colors text-center text-base md:text-lg shadow-sm">
                Solicitar información
              </Link>
              <Link href="/contacto" className="bg-white border-2 border-[#040F21] hover:bg-[#040F21] hover:text-white text-[#040F21] font-bold py-3 md:py-4 px-6 md:px-8 rounded transition-colors text-center text-base md:text-lg">
                Abrir cuenta
              </Link>
            </div>
          </div>

          {/* Right: Image */}
          <div className="relative aspect-[4/3] sm:aspect-[3/2] rounded overflow-hidden shadow-xl mt-6 lg:mt-0">
            <Image
              src="/images/cod/hero2.jpg"
              alt="Repartidor AirCargo"
              fill
              className="object-cover"
              priority
            />
          </div>

        </div>
      </div>
    </section>
  );
}
