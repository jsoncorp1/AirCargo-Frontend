import React from "react";
import Link from "next/link";

export function FloatingCards() {
  return (
    <section className="relative z-20 container mx-auto px-4 -mt-16 md:-mt-24 mb-16">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.1)] border border-gray-100 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
        {/* Card 1 */}
        <Link href="/signin" className="group p-5 md:p-8 text-center border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-50 transition-colors flex flex-col items-center">
          <div className="text-brand-600 mb-3 md:mb-4 transform group-hover:scale-110 transition-transform">
            <svg className="w-10 h-10 md:w-12 md:h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="font-bold text-gray-900 text-lg md:text-xl mb-2">Crear un Envío</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Inicie sesión en el Portal de Clientes para gestionar un envío.
          </p>
        </Link>

        {/* Card 2 */}
        <a href="https://wa.me/59167723108" target="_blank" rel="noopener noreferrer" className="group p-5 md:p-8 text-center border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-50 transition-colors flex flex-col items-center">
          <div className="text-green-500 mb-3 md:mb-4 transform group-hover:scale-110 transition-transform">
            {/* WhatsApp Icon for visual context */}
            <svg className="w-10 h-10 md:w-12 md:h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.383 0 0 5.383 0 12.031c0 2.115.548 4.17 1.59 5.986L.044 23.956l6.104-1.602a11.977 11.977 0 005.883 1.53h.005c6.648 0 12.031-5.383 12.031-12.031S18.679 0 12.031 0zm0 21.916a9.986 9.986 0 01-5.088-1.385l-.364-.216-3.784.992.993-3.69-.237-.377A9.974 9.974 0 012.046 12.03c0-5.508 4.484-9.992 9.985-9.992s9.992 4.484 9.992 9.992-4.484 9.986-9.992 9.986zm5.485-7.498c-.301-.151-1.782-.878-2.059-.979-.277-.101-.478-.151-.679.151-.201.301-.78 1.006-.957 1.207-.176.201-.352.226-.653.075-2.062-1.034-3.411-1.921-4.708-4.137-.176-.301-.018-.465.132-.615.136-.135.301-.352.452-.527.151-.176.201-.301.301-.502.101-.201.05-.377-.025-.527-.075-.151-.679-1.636-.93-2.241-.243-.591-.49-.511-.679-.52-.176-.01-.377-.01-.578-.01a1.11 1.11 0 00-.804.377c-.277.301-1.055 1.03-1.055 2.512s1.08 2.914 1.231 3.115c.151.201 2.126 3.245 5.148 4.549 2.052.887 2.871.933 3.864.782.915-.141 2.812-1.152 3.214-2.264.402-1.112.402-2.062.277-2.264-.125-.202-.452-.303-.753-.454z" /></svg>
          </div>
          <h3 className="font-bold text-gray-900 text-lg md:text-xl mb-2">Cotización Rápida</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Habla por WhatsApp con un ejecutivo para cotizar tus paquetes al instante.
          </p>
        </a>

        {/* Card 3 */}
        <Link href="/contacto" className="group p-5 md:p-8 text-center bg-brand-50 hover:bg-brand-100 transition-colors flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500 transform translate-x-8 -translate-y-8 rotate-45"></div>

          <div className="text-brand-600 mb-3 md:mb-4 transform group-hover:scale-110 transition-transform relative z-10">
            <svg className="w-10 h-10 md:w-12 md:h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <h3 className="font-bold text-gray-900 text-lg md:text-xl mb-2 relative z-10">Cuenta Comercial</h3>
          <p className="text-gray-600 text-sm leading-relaxed relative z-10">
            Si su empresa realiza envíos regularmente, solicite una cuenta corporativa
          </p>
        </Link>
      </div>
    </section>
  );
}
