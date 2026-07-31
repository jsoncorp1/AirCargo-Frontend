"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserIcon } from "@/icons";
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
});

const WHATSAPP_NUMBER = "59167723108";
const PHONE_DISPLAY = "677 231 08";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? "bg-white shadow-md py-2 border-b border-gray-100"
        : "bg-white/95 backdrop-blur-md py-3 shadow-sm border-b border-gray-100"
        }`}
    >
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Logo Image */}
        <Link href="/" className="flex items-center">
          <div className="relative h-10 w-32 sm:h-12 sm:w-36 transition-all duration-300 invert opacity-90">
            <Image
              src="/images/logo/aircargologolanding.png"
              alt="AirCargo Express"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8 ml-8">
          {[
            { label: "Inicio", href: "/" },
            { label: "Servicio Contraentrega", href: "/servicios/contraentrega" },
            { label: "Envío Esporádico", href: "/servicios/envio-esporadico" },
            { label: "Contacto", href: "/contacto" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-bold text-gray-700 transition-colors hover:text-brand-600 uppercase tracking-wide"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-4 ml-auto">
          <Link
            href="/signin"
            className="hidden md:flex items-center gap-1.5 text-sm font-bold text-gray-700 transition-colors hover:text-brand-600"
          >
            <UserIcon className="w-4 h-4" />
            Portal de Clientes
          </Link>

          <Link
            href="/contacto"
            className="hidden md:inline-flex items-center justify-center text-sm font-bold px-6 py-2.5 rounded transition-all duration-300 bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 uppercase tracking-wide"
          >
            Cotizar Envío
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 text-gray-800"
            aria-label="Menú"
          >
            <div className="space-y-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`block h-0.5 rounded-full transition-all bg-gray-800 ${i === 1 ? "w-4 ml-auto" : "w-6"}`}
                />
              ))}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`lg:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-2xl transition-all duration-300 origin-top ${menuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`}>
        <div className="p-4 space-y-1">
          {[
            { label: "Inicio", href: "/" },
            { label: "Servicio Contraentrega", href: "/servicios/contraentrega" },
            { label: "Envío Esporádico", href: "/servicios/envio-esporadico" },
            { label: "Contacto", href: "/contacto" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 px-4 text-sm font-bold uppercase tracking-wide text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-4 mt-2 border-t border-gray-100 space-y-3">
            <Link
              href="/signin"
              className="flex items-center gap-3 py-3 px-4 text-sm font-bold uppercase tracking-wide text-gray-700 hover:text-brand-600 hover:bg-gray-50 rounded-lg"
            >
              <UserIcon className="w-5 h-5" />
              Portal de Clientes
            </Link>
            <Link
              href="/contacto"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center py-3.5 px-4 text-sm font-bold uppercase tracking-wide bg-brand-600 text-white rounded-lg shadow-lg shadow-brand-500/20"
            >
              Cotizar Envío
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 pt-16 pb-8 border-t border-gray-800">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-10 mb-12">
          <div className="text-center md:text-left">
            <div className="relative h-12 w-36 mx-auto md:mx-0 mb-4 brightness-0 invert opacity-80">
              <Image src="/images/logo/aircargologolanding.png" alt="AirCargo" fill className="object-contain object-center md:object-left" />
            </div>
            <p className="text-gray-400 text-sm max-w-xs mx-auto md:mx-0 leading-relaxed">
              Agencia de viajes y logística integral. Entregas y cobranzas seguras en todo Bolivia.
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

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
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

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 ${roboto.className} selection:bg-brand-500 selection:text-white flex flex-col`}>
      <Navbar />
      <main className="flex-1 pt-[72px]">
        {children}
      </main>
      <Footer />
    </div>
  );
}
