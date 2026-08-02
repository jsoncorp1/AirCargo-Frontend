import React from "react";
import Link from "next/link";
import { ContactForm } from "@/components/public/contacto/ContactForm";

export default function ContactoPage() {
  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* BREADCRUMBS */}
      <div className="bg-white border-b border-gray-100 py-3 mb-10">
        <div className="container mx-auto px-4 md:px-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-brand-600 transition-colors">Inicio</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-semibold">Contacto</span>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Info lateral */}
          <div className="lg:col-span-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Habla con nuestros expertos
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Comunícate con nosotros para cotizar tus envíos y descubrir los planes que tenemos para tu negocio o e-commerce.
            </p>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-2">WhatsApp Directo</h4>
                <p className="text-gray-500 text-sm mb-3">Atención al cliente y cotizaciones rápidas.</p>
                <a href="https://wa.me/59167723108" className="text-brand-600 font-bold hover:underline">
                  +591 677 231 08
                </a>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-2">Oficina Central</h4>
                <p className="text-gray-500 text-sm">
                  Santa Cruz, Bolivia<br/>
                  Atención en horario continuo.
                </p>
              </div>
            </div>
          </div>
          
          {/* Formulario */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
