"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserIcon } from "@/icons";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: "Inicio", href: "/" },
    { label: "Servicio Contraentrega", href: "/servicios/contraentrega" },
    { label: "Envío Esporádico", href: "/servicios/envio-esporadico" },
    { label: "Contacto", href: "/contacto" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col shadow-md">
      {/* Top Bar - Navy Blue */}
      <div className="bg-[#040F21] h-14 flex items-center justify-between px-4 lg:px-8">
        <Link href="/">
          <div className="relative h-8 w-32">
            <Image
              src="/images/logo/aircargologolanding.png"
              alt="AirCargo"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>
        <Link href="#" className="text-white text-sm font-semibold hover:text-[#FF7A00] transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="hidden sm:inline">Ayuda y soporte</span>
        </Link>
      </div>

      {/* Sub Nav Bar - White */}
      <div className="bg-white border-b border-[#E7EAF0] h-12 flex items-center px-4 lg:px-8">
        <nav className="hidden md:flex h-full gap-2 lg:gap-4 text-sm font-bold">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-2 lg:px-3 border-b-[3px] transition-colors ${isActive
                    ? 'border-[#FF7A00] text-[#FF7A00]'
                    : 'border-transparent text-[#040F21] hover:text-[#FF7A00] hover:border-[#FF7A00]'
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Acciones Derecha (Portal y Menú) */}
        <div className="ml-auto flex items-center gap-4">
          <Link 
            href="/signin" 
            className="flex items-center gap-2 text-sm font-bold text-[#040F21] hover:text-[#FF7A00] transition-colors bg-[#F8F9FB] hover:bg-[#FF7A00]/10 px-3 py-1.5 rounded-md border border-[#E7EAF0] hover:border-[#FF7A00]/30"
          >
            <UserIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Portal del Cliente</span>
            <span className="sm:hidden">Ingresar</span>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-[#040F21] p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-2xl transition-all duration-300 origin-top ${menuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`}>
        <div className="p-3 flex flex-col gap-1 text-sm font-bold">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`p-3 rounded-lg transition-colors ${isActive
                    ? 'bg-[#FF7A00]/10 text-[#FF7A00]'
                    : 'text-[#040F21] hover:bg-gray-50 hover:text-[#FF7A00]'
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
