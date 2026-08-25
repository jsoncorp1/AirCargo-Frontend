import React from "react";
import Link from "next/link";

export function ContactStrip() {
  return (
    <section className="bg-brand-600 py-12 text-white">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">¿Necesitas asesoría personalizada?</h2>
        <p className="text-brand-100 mb-8 max-w-2xl mx-auto">
          Nuestro equipo de ejecutivos está listo para ayudarte a armar un plan logístico que se adapte perfectamente a las exigencias de tu empresa.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          {/* El formulario queda primero: WhatsApp depende de que haya alguien
              del otro lado, mientras que la solicitud queda registrada aunque
              se mande un domingo a la noche. */}
          <Link
            href="/contacto"
            className="w-full sm:w-auto inline-block bg-white text-brand-700 font-bold py-3 px-8 rounded transition-all hover:bg-gray-100 shadow-lg uppercase text-sm tracking-wide"
          >
            Solicitar asesoría
          </Link>
          <a
            href="https://wa.me/59167723108"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-block border-2 border-white/70 text-white font-bold py-3 px-8 rounded transition-all hover:bg-white/10 uppercase text-sm tracking-wide"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
