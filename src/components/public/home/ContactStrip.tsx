import React from "react";

export function ContactStrip() {
  return (
    <section className="bg-brand-600 py-12 text-white">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">¿Necesitas asesoría personalizada?</h2>
        <p className="text-brand-100 mb-8 max-w-2xl mx-auto">
          Nuestro equipo de ejecutivos está listo para ayudarte a armar un plan logístico que se adapte perfectamente a las exigencias de tu empresa.
        </p>
        <a
          href="https://wa.me/59167723108"
          className="inline-block bg-white text-brand-700 font-bold py-3 px-8 rounded transition-all hover:bg-gray-100 shadow-lg uppercase text-sm tracking-wide"
        >
          Contactar por WhatsApp
        </a>
      </div>
    </section>
  );
}
