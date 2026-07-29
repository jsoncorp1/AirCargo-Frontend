"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BoxCubeIcon,
  CheckCircleIcon,
  DollarLineIcon,
  EnvelopeIcon,
  LockIcon,
  GridIcon,
  BoxIcon,
  TimeIcon,
  UserIcon,
} from "@/icons";
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
});

const WHATSAPP_NUMBER = "59167723108";
const PHONE_DISPLAY = "677 231 08";

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 py-2"
        : "bg-transparent py-4"
        }`}
    >
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Logo Image */}
        <Link href="/" className="flex items-center">
          <div className={`relative transition-all duration-300 ${scrolled ? "h-15 w-45 invert opacity-90" : "h-[160px] w-[550px] opacity-100"}`}>
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
        <nav className="hidden lg:flex items-center gap-8">
          {[
            { label: "Contra Entrega", href: "#contra-entrega" },
            { label: "Cómo funciona", href: "#como-funciona" },
            { label: "Beneficios", href: "#beneficios" },
            { label: "Contacto", href: "#formulario" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-brand-500 ${scrolled ? "text-gray-600" : "text-white/90 drop-shadow-md"
                }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden xl:flex items-center gap-2 text-sm font-bold transition-colors hover:text-brand-500 ${scrolled ? "text-gray-700" : "text-white drop-shadow-md"
              }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.116 1.526 5.845L.057 23.93l6.256-1.638A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6c-1.9 0-3.67-.51-5.192-1.4l-.373-.22-3.856 1.01 1.03-3.764-.243-.388A9.6 9.6 0 012.4 12c0-5.295 4.305-9.6 9.6-9.6 5.296 0 9.6 4.305 9.6 9.6 0 5.296-4.304 9.6-9.6 9.6z" />
            </svg>
            {PHONE_DISPLAY}
          </a>

          <Link
            href="/signin"
            className={`hidden md:flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-brand-500 ${scrolled ? "text-gray-600" : "text-white/90 drop-shadow-md"
              }`}
          >
            <UserIcon className="w-4 h-4" />
            Iniciar sesión
          </Link>

          <a
            href="#formulario"
            className={`hidden md:inline-flex items-center justify-center text-sm font-semibold px-6 py-2.5 rounded-full transition-all duration-300 ${scrolled
              ? "bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20"
              : "bg-white text-brand-600 hover:bg-gray-100 shadow-xl"
              }`}
          >
            Solicitar asesoría
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2"
            aria-label="Menú"
          >
            <div className="space-y-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`block h-0.5 rounded-full transition-all ${i === 1 ? "w-4 ml-auto" : "w-6"} ${scrolled ? "bg-gray-800" : "bg-white shadow"}`}
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
            { label: "Contra Entrega", href: "#contra-entrega" },
            { label: "Cómo funciona", href: "#como-funciona" },
            { label: "Beneficios", href: "#beneficios" },
            { label: "Contacto", href: "#formulario" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 px-4 text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-4 mt-2 border-t border-gray-100 space-y-3">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-3 px-4 text-base font-medium text-green-600 bg-green-50 rounded-xl"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.116 1.526 5.845L.057 23.93l6.256-1.638A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6c-1.9 0-3.67-.51-5.192-1.4l-.373-.22-3.856 1.01 1.03-3.764-.243-.388A9.6 9.6 0 012.4 12c0-5.295 4.305-9.6 9.6-9.6 5.296 0 9.6 4.305 9.6 9.6 0 5.296-4.304 9.6-9.6 9.6z" /></svg>
              WhatsApp: {PHONE_DISPLAY}
            </a>
            <Link
              href="/signin"
              className="flex items-center gap-3 py-3 px-4 text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50 rounded-xl"
            >
              <UserIcon className="w-5 h-5" />
              Iniciar sesión
            </Link>
            <a
              href="#formulario"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center py-3.5 px-4 text-base font-bold bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-500/20"
            >
              Solicitar asesoría gratuita
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Contact Form ──────────────────────────────────────────────────────────────
function ContactForm() {
  const [formState, setFormState] = useState({
    compania: "",
    direccion: "",
    codigoPostal: "",
    ciudad: "",
    pais: "Bolivia",
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    infoAdicional: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  if (isSuccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-16 px-8 animate-fade-in-up">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircleIcon className="w-12 h-12 text-green-500" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-4">¡Muchas gracias!</h3>
        <p className="text-gray-600 mb-3 max-w-sm mx-auto text-lg">
          Hemos recibido tu solicitud de asesoría.
        </p>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Un asesor especializado de <strong>AIRCARGO EXPRESS</strong> se comunicará contigo para brindarte toda la información que necesitas.
        </p>
        <button
          onClick={() => { setIsSuccess(false); setFormState({ compania: "", direccion: "", codigoPostal: "", ciudad: "", pais: "Bolivia", nombre: "", apellido: "", correo: "", telefono: "", infoAdicional: "" }); }}
          className="text-brand-600 font-semibold hover:bg-brand-50 px-6 py-2 rounded-full transition-colors"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  const inputClass = "w-full mt-2 px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all";
  const labelClass = "block text-sm text-gray-600 mb-1";
  const reqClass = "text-red-500";

  return (
    <div className="p-6 md:p-8 lg:p-10 bg-white">
      <div className="text-center mb-8">
        <p className="text-gray-600 text-sm">Envíenos sus datos y nos pondremos en contacto.</p>
        <p className="text-gray-500 text-xs mt-2">Todos los campos marcados con asterisco (<span className={reqClass}>*</span>) son obligatorios</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* COLUMNA IZQUIERDA: Datos de la empresa */}
          <div className="space-y-5">
            <h4 className="font-bold text-gray-900 text-sm border-b pb-2">Datos de la empresa</h4>

            <div>
              <label className={labelClass}>Nombre de la Compañía <span className={reqClass}>*</span></label>
              <input className={inputClass} type="text" name="compania" value={formState.compania} onChange={handleChange} required />
            </div>

            <div>
              <label className={labelClass}>Dirección de la compañía <span className={reqClass}>*</span></label>
              <input className={inputClass} type="text" name="direccion" value={formState.direccion} onChange={handleChange} required />
            </div>

            <div>
              <label className={labelClass}>Código postal <span className={reqClass}>*</span></label>
              <input className={inputClass} type="text" name="codigoPostal" value={formState.codigoPostal} onChange={handleChange} required />
            </div>

            <div>
              <label className={labelClass}>Ciudad <span className={reqClass}>*</span></label>
              <select className={inputClass} name="ciudad" value={formState.ciudad} onChange={handleChange} required>
                <option value="" disabled>Seleccionar...</option>
                {["Santa Cruz", "La Paz", "Cochabamba", "Oruro", "Potosí", "Sucre", "Trinidad", "Cobija", "Tarija"].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>País <span className={reqClass}>*</span></label>
              <div className="relative">
                <input className={`${inputClass} bg-gray-50 pl-10 cursor-not-allowed`} type="text" name="pais" value="Bolivia" disabled />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xl mt-1">🇧🇴</div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 mt-1">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Persona de contacto */}
          <div className="space-y-5">
            <h4 className="font-bold text-gray-900 text-sm border-b pb-2">Persona de contacto</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nombre <span className={reqClass}>*</span></label>
                <input className={inputClass} type="text" name="nombre" value={formState.nombre} onChange={handleChange} required />
              </div>
              <div>
                <label className={labelClass}>Apellido <span className={reqClass}>*</span></label>
                <input className={inputClass} type="text" name="apellido" value={formState.apellido} onChange={handleChange} required />
              </div>
            </div>

            <div>
              <label className={labelClass}>Correo electrónico de trabajo <span className={reqClass}>*</span></label>
              <input className={inputClass} type="email" name="correo" value={formState.correo} onChange={handleChange} required placeholder="ejemplo@email.com" />
            </div>

            <div className="flex gap-4">
              <div className="w-1/3">
                <label className={labelClass}>&nbsp;</label>
                <select className={inputClass}>
                  <option>+591</option>
                </select>
              </div>
              <div className="w-2/3">
                <label className={labelClass}>Teléfono <span className={reqClass}>*</span></label>
                <input className={inputClass} type="tel" name="telefono" value={formState.telefono} onChange={handleChange} required placeholder="p. ej. 123 456 789" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Información Adicional (opcional)</label>
              <textarea
                className={`${inputClass} resize-none h-32`}
                name="infoAdicional"
                value={formState.infoAdicional}
                onChange={handleChange}
                maxLength={100}
                placeholder="Describa lo que envía, el peso aproximado, los requisitos especiales, etc."
              />
              <div className="text-right text-xs text-gray-400 mt-1">{formState.infoAdicional.length} / 100</div>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600 mt-8 mb-6 max-w-xl mx-auto">
          Si deseas obtener más información sobre cómo AirCargo utiliza tus datos personales, consulta nuestro aviso de privacidad que se encuentra en el pie de página.
        </div>

        <div className="flex justify-center gap-4 border-t pt-8">
          <button type="button" className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-50 transition-colors shadow-sm">
            Atrás
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formState.compania || !formState.direccion || !formState.codigoPostal || !formState.ciudad || !formState.nombre || !formState.apellido || !formState.correo || !formState.telefono}
            className="px-12 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded transition-colors shadow-sm"
          >
            {isSubmitting ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ContraEntregaLandingPage() {
  return (
    <div className={`min-h-screen bg-white text-gray-900 ${roboto.className} selection:bg-brand-500 selection:text-white`}>
      <Navbar />

      {/* ═══ 1. HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[100vh] flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-cod.png"
            alt="AirCargo Express — Contra Entrega"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d1b3e]/95 via-[#0d1b3e]/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-4 md:px-8 py-20">
          <div className="max-w-2xl animate-fade-in-up">

            {/* <h1 className="text-4xl md:text-6xl xl:text-[4.5rem] font-extrabold text-white leading-[1.05] mb-6 tracking-tight drop-shadow-md">
              Vende y cobra <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-500">al entregar</span>
            </h1> */}

            <p className="text-lg md:text-xl text-gray-200 leading-relaxed mb-10 max-w-xl font-light">
              <strong className="font-semibold text-white">AIRCARGO EXPRESS</strong> gestiona la distribución y cobranza de tus pedidos. Tú enfócate en vender, nosotros hacemos el resto.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <a
                href="#formulario"
                className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-brand-500/30 text-lg hover:-translate-y-1"
              >
                Solicitar asesoría
              </a>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/20 hover:border-white text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 backdrop-blur-sm text-lg hover:bg-white/5"
              >
                Conoce el servicio →
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-8 border-t border-white/10">
              <div>
                <div className="text-2xl font-bold text-white mb-1">Eje troncal</div>
                <div className="text-brand-300 text-sm font-medium">Cobertura Nacional</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">QR + Cash</div>
                <div className="text-brand-300 text-sm font-medium">Métodos de cobro</div>
              </div>
              <div className="col-span-2 md:col-span-1">
                <div className="text-2xl font-bold text-white mb-1">0 Riesgos</div>
                <div className="text-brand-300 text-sm font-medium">Pagos asegurados</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2. QUÉ ES CONTRA ENTREGA ═════════════════════════════════════════ */}
      <section id="contra-entrega" className="py-24 md:py-32 bg-white relative">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Imagen UI */}
            <div className="relative order-2 lg:order-1 group">
              <div className="absolute inset-0 bg-brand-500/5 rounded-3xl transform -rotate-3 scale-105 transition-transform duration-500 group-hover:-rotate-1" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] border border-gray-100">
                <Image src="/images/1.jpg" alt="Cobro en entrega" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-6 left-6 right-6">
                </div>
              </div>
            </div>

            {/* Texto */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 text-brand-700 font-bold text-xs uppercase tracking-widest mb-6">
                Servicio COD
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
                El modelo perfecto para <span className="text-brand-600">romper la desconfianza</span>
              </h2>
              <p className="text-gray-600 text-xl leading-relaxed mb-8">
                El Pago Contra Entrega (COD) permite a tu cliente pagar en el momento exacto en que recibe el paquete, eliminando el miedo a estafas por compras online.
              </p>

              <div className="space-y-6 mb-10">
                {[
                  { title: "Pagos 100% seguros", desc: "Cobramos en efectivo o mediante QR, y no entregamos el producto hasta confirmar el pago." },
                  { title: "Logística delegada", desc: "Tú solo empaquetas. Nosotros recogemos, transportamos, entregamos y cobramos." },
                  { title: "Liquidación puntual", desc: "Depositamos el dinero recaudado de tus ventas directamente a tu cuenta bancaria." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mt-1">
                      <CheckCircleIcon className="w-4 h-4 text-brand-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{item.title}</h4>
                      <p className="text-gray-600 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3. CÓMO FUNCIONA ═════════════════════════════════════════════════ */}
      <section id="como-funciona" className="py-24 md:py-32 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Simple. Rápido. <span className="text-brand-600">Eficiente.</span>
            </h2>
            <p className="text-gray-600 text-xl leading-relaxed">
              Un flujo de trabajo optimizado donde <strong>AIRCARGO EXPRESS</strong> se encarga de lo pesado, para que tú te dediques a crecer tu negocio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: "1", icon: <EnvelopeIcon className="w-8 h-8" />, title: "Vendes", desc: "Cierras la venta por WhatsApp o Web. El cliente elige pagar al recibir.", img: "/images/4.jpg" },
              { num: "2", icon: <BoxCubeIcon className="w-8 h-8" />, title: "Recogemos", desc: "Nuestros móviles pasan por tu local o almacén a recolectar los paquetes.", img: "/images/3.jpg" },
              { num: "3", icon: <DollarLineIcon className="w-8 h-8" />, title: "Entregamos", desc: "Llevamos el paquete al domicilio y realizamos la gestión de cobro.", img: "/images/1.jpg" },
              { num: "4", icon: <CheckCircleIcon className="w-8 h-8" />, title: "Depositamos", desc: "Liquidamos tus fondos y los transferimos a tu cuenta corporativa.", img: "/images/2.jpg" },
            ].map((step) => (
              <div key={step.num} className="relative group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className="relative h-48 overflow-hidden">
                  <Image src={step.img} alt={step.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                  <div className="absolute inset-0 bg-gray-900/40 group-hover:bg-gray-900/20 transition-colors duration-500" />
                  <div className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white font-bold border border-white/30">
                    {step.num}
                  </div>
                </div>
                <div className="p-8 text-center relative">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/40 transform group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mt-6 mb-3">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed font-medium">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 4. ACERCA DE AIRCARGO ════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay">
          <Image src="/images/hero-cod.png" alt="" fill className="object-cover" />
        </div>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-white leading-tight">
                El respaldo de <span className="text-brand-400">AIRCARGO EXPRESS</span>
              </h2>
              <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-8">
                Más que una empresa de courier, somos una agencia de viajes y envíos de carga nacional.
                Nuestra infraestructura logística asegura que tus entregas se realicen con eficiencia,
                cuidando tanto la experiencia de tu cliente final como la seguridad de tu dinero.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
                {[
                  { title: "Seguridad Financiera", desc: "Liquidaciones garantizadas sin retrasos sorpresivos." },
                  { title: "Cobertura Troncal", desc: "Llegamos a los mercados más grandes de Bolivia." },
                  { title: "Atención Especializada", desc: "Soporte corporativo directo, sin bots interminables." },
                  { title: "Tecnología y Rastreo", desc: "Trazabilidad completa de cada paquete despachado." }
                ].map(b => (
                  <div key={b.title} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <h4 className="font-bold text-white text-lg mb-2">{b.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Decoración visual a la derecha */}
            <div className="relative w-full h-[500px] hidden lg:block rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <Image src="/images/2.jpg" alt="Logística" fill className="object-cover" />
              <div className="absolute inset-0 bg-brand-900/30 mix-blend-multiply" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BENEFICIOS ═══════════════════════════════════════════════════════ */}
      <section id="beneficios" className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="text-brand-500 text-sm font-semibold uppercase tracking-wider">Ventajas</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-5">
                ¿Por qué integrar Contra<br />Entrega en tu negocio?
              </h2>
              <p className="text-gray-500 mb-10 leading-relaxed text-lg">
                Rompe la barrera de la desconfianza y cierra más ventas con clientes que aún no confían en pagar por adelantado.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { icon: <DollarLineIcon className="w-6 h-6" />, title: "Pago contra entrega", desc: "Efectivo o QR verificado en puerta" },
                  { icon: <GridIcon className="w-6 h-6" />, title: "Cobro mediante QR", desc: "Sin manejo de efectivo, cero riesgos" },
                  { icon: <TimeIcon className="w-6 h-6" />, title: "Seguimiento en vivo", desc: "Tu cliente sabe dónde está su paquete" },
                  { icon: <LockIcon className="w-6 h-6" />, title: "Seguridad total", desc: "Reportes transparentes de cobranza" },
                  { icon: <BoxIcon className="w-6 h-6" />, title: "Cobertura nacional", desc: "Eje troncal y conexiones a provincias" },
                  { icon: <BoxCubeIcon className="w-6 h-6" />, title: "Ideal e-commerce", desc: "Diseñado para escalar tiendas online" },
                ].map((b) => (
                  <div key={b.title} className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all">
                    <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center shrink-0">
                      {b.icon}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base">{b.title}</p>
                      <p className="text-gray-500 text-sm mt-1 leading-tight">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/60 aspect-[3/4]">
                <Image src="/images/4.jpg" alt="Preparando paquetes para envío" fill className="object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-3xl p-6 shadow-xl border border-gray-100 max-w-sm">
                <p className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">Para tu negocio</p>
                <p className="font-extrabold text-gray-900 text-lg leading-tight">Multiplica tus ventas online</p>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                  Clientes que dudan en pagar por adelantado sí compran cuando el pago es al recibir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 5. FORMULARIO ════════════════════════════════════════════════════ */}
      <section id="formulario" className="py-24 md:py-32 bg-gray-50 relative">
        <div className="absolute inset-x-0 top-0 h-64 bg-gray-900" />

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center mb-12 max-w-2xl mx-auto text-white">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
              Habla con un asesor
            </h2>
            <p className="text-gray-300 text-lg">
              Cotiza sin compromiso y descubre planes diseñados a la medida de tu volumen de envíos.
            </p>
          </div>

          <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl shadow-gray-200/80 overflow-hidden border border-gray-100">
            {/* Formulario que abarca todo el ancho */}
            <div className="w-full">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer Minimalista Profesional */}
      <footer className="bg-gray-950 pt-20 pb-10 border-t border-gray-900">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-10 mb-16">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">AIRCARGO EXPRESS</h2>
              <p className="text-gray-500 text-sm max-w-xs mx-auto md:mx-0 leading-relaxed">
                Agencia de viajes y logística integral. Entregas y cobranzas seguras en todo Bolivia.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 md:gap-16 text-center md:text-left">
              <div>
                <h4 className="text-white font-bold mb-4">Enlaces rápidos</h4>
                <ul className="space-y-3">
                  <li><a href="#como-funciona" className="text-gray-400 hover:text-white transition-colors text-sm">Cómo funciona</a></li>
                  <li><a href="#contra-entrega" className="text-gray-400 hover:text-white transition-colors text-sm">Servicio COD</a></li>
                  <li><Link href="/signin" className="text-brand-400 hover:text-brand-300 transition-colors text-sm font-semibold">Portal de Clientes</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">Contacto</h4>
                <ul className="space-y-3">
                  <li>
                    <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center justify-center md:justify-start gap-2">
                      WhatsApp: {PHONE_DISPLAY}
                    </a>
                  </li>
                  <li className="text-gray-400 text-sm">Santa Cruz, Bolivia</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
            <p>&copy; {new Date().getFullYear()} AirCargo Express. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-gray-300 transition-colors">Términos de servicio</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Privacidad</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
