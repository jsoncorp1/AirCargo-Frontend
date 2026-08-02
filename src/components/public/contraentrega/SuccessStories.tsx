"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

const SUCCESS_SLIDER = [
  {
    image: "/images/cod/jonathan1.png",
    text: "Jonathan recibió su pedido y pagó Bs. 699 al momento de la entrega.",
  },
  {
    image: "/images/cod/maria1.png",
    text: "María recibió su compra en la puerta de su domicilio.",
  },
  {
    image: "/images/cod/driver1.png",
    text: "Entrega segura en cualquier departamento del país.",
  }
];

const TESTIMONIALS = [
  {
    id: 1,
    name: "Juan Pérez",
    store: "StoreBolivia",
    text: "Muy buen servicio, ya llevo más de 1.500 envíos con AirCargo y todo excelente.",
  },
  {
    id: 2,
    name: "Carla Mendoza",
    store: "Fashion SCZ",
    text: "Antes tenía muchos problemas con otras empresas, ahora puedo hacer seguimiento de todos mis pedidos y mis clientes están contentos.",
  },
  {
    id: 3,
    name: "Gerente de Operaciones",
    store: "ViralShop",
    text: "Resultados reales. De 1,500 envíos que despachamos, entregamos exitosamente 1,100 sin contratiempos. Las devoluciones las recuperamos de forma rápida y segura.",
  }
];

export function SuccessStories() {
  const [activeSuccessImage, setActiveSuccessImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSuccessImage((prev) => (prev + 1) % SUCCESS_SLIDER.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* CAPTURAS DEL SISTEMA */}
      <section className="py-20 bg-white border-b border-[#E7EAF0]">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-[#040F21] mb-6">Plataforma Web Especializada</h2>
            <p className="text-lg text-[#565A6B]">
              Nuestro sistema permite conocer en tiempo real el estado de cada envío. Administra tu negocio corporativo de forma transparente, visualizando métricas, reportes y estados: <span className="font-bold text-[#22C55E]">Entregado</span>, <span className="font-bold text-[#FF7A00]">Pendiente</span> o <span className="font-bold text-[#EF4444]">Rechazado</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#F8F9FB] p-4 rounded border border-[#E7EAF0] shadow-sm">
              <p className="text-sm font-bold text-[#040F21] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span> Dashboard de Seguimiento
              </p>
              <div className="relative aspect-[1715/775] rounded overflow-hidden shadow border border-[#E7EAF0]">
                <Image src="/images/cod/dashboard11.png" alt="Dashboard Map" fill className="object-cover" />
              </div>
            </div>

            <div className="bg-[#F8F9FB] p-4 rounded border border-[#E7EAF0] shadow-sm">
              <p className="text-sm font-bold text-[#040F21] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF7A00]"></span> Lista de Envíos y Estados
              </p>
              <div className="relative aspect-[1708/850] rounded overflow-hidden shadow border border-[#E7EAF0]">
                <Image src="/images/cod/dashboard22.png" alt="Dashboard Table" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-20 bg-[#F8F9FB]">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <h2 className="text-3xl font-bold text-[#040F21] mb-12 text-center">Empresas que confían en nosotros</h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Slider de Casos - Columna izquierda (5 columnas) */}
            <div className="lg:col-span-5 relative aspect-[4/3] rounded bg-white overflow-hidden shadow border border-[#E7EAF0]">
              {SUCCESS_SLIDER.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ${activeSuccessImage === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <Image src={slide.image} alt="Caso de Éxito" fill className="object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-[#040F21]/90 p-6 backdrop-blur-sm">
                    <p className="text-white text-lg font-semibold">"{slide.text}"</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonios - Columna derecha (7 columnas) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div key={t.id} className={`bg-white p-6 rounded border border-[#E7EAF0] shadow-sm relative ${i === 2 ? 'sm:col-span-2' : ''}`}>
                  <div className="absolute top-6 right-6 text-[#E7EAF0]">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                  </div>
                  <p className="text-[#565A6B] text-sm italic mb-4 relative z-10">"{t.text}"</p>
                  <div>
                    <p className="font-bold text-[#040F21] text-sm">{t.name}</p>
                    <p className="text-xs text-[#7A7D88]">{t.store}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
