"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const WHATSAPP_NUMBER = "59167723108";
const PHONE_DISPLAY = "677 231 08";

export function Footer({ showBottomPadding }: { showBottomPadding?: boolean }) {
  return (
    <footer className="bg-gray-900 pt-16 pb-8 border-t border-gray-800">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-10 mb-12">
          <div className="text-center md:text-left">
            <div className="relative h-12 w-36 mx-auto md:mx-0 mb-4 opacity-90">
              <Image src="/images/logo/logoaircargoblanco.png" alt="AirCargo" fill className="object-contain object-center md:object-left" />
            </div>
            <p className="text-gray-400 text-sm max-w-xs mx-auto md:mx-0 leading-relaxed">
              Logística integral. Entregas y cobranzas seguras en todo Bolivia.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 md:gap-16 text-center md:text-left">
            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-wide text-sm">Servicios</h4>
              <ul className="space-y-3">
                <li><Link href="/servicios/contraentrega" className="text-gray-400 hover:text-white transition-colors text-sm">Contraentrega (COD)</Link></li>
                <li><Link href="/servicios/envio-esporadico" className="text-gray-400 hover:text-white transition-colors text-sm">Envío Esporádico</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-wide text-sm">Contacto</h4>
              <ul className="space-y-3">
                <li>
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center justify-center md:justify-start gap-2">
                    WhatsApp: {PHONE_DISPLAY}
                  </a>
                </li>
                <li className="text-gray-400 text-sm">Santa Cruz, Bolivia</li>
                <li><Link href="/signin" className="text-brand-400 hover:text-brand-300 transition-colors text-sm font-semibold">Portal de Clientes</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className={`border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 ${showBottomPadding ? 'mb-20 lg:mb-0' : ''}`}>
          <p>&copy; {new Date().getFullYear()} AirCargo Express. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-gray-300 transition-colors">Aviso de Privacidad</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">Términos y Condiciones</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
