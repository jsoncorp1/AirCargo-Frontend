"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircleIcon, UserIcon, BoxIcon, TimeIcon } from "@/icons";

export default function ContraentregaPage() {
  const [activeImage, setActiveImage] = useState("/images/4.jpg");
  const thumbnails = [
    "/images/4.jpg",
    "/images/1.jpg",
    "/images/2.jpg",
    "/images/3.jpg",
  ];

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* BREADCRUMBS */}
      <div className="bg-gray-50 border-b border-gray-100 py-3">
        <div className="container mx-auto px-4 md:px-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-brand-600 transition-colors">Inicio</Link>
          <span className="mx-2">/</span>
          <span>Servicios</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-semibold">Contraentrega</span>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-10 md:py-16">
        {/* PRODUCT STYLE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-20">
          
          {/* Columna Izquierda: Galería de Imágenes */}
          <div className="flex flex-col gap-4">
            <div className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-gray-50">
              <Image 
                src={activeImage} 
                alt="Servicio Contraentrega" 
                fill 
                className="object-cover"
                priority
              />
              <div className="absolute top-4 left-4 bg-brand-600 text-white text-xs font-bold uppercase px-3 py-1 rounded-full shadow-md">
                Servicio Estrella
              </div>
            </div>
            
            {/* Thumbnails */}
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
              {thumbnails.map((img, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 snap-start border-2 transition-all ${
                    activeImage === img ? "border-brand-600 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt={`Thumbnail ${i}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Detalles del Servicio */}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
              Servicio de Contraentrega (COD)
            </h1>
            
            {/* Reseñas / Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-gray-600 text-sm font-medium">4.9 (125 reseñas verificadas)</span>
            </div>

            {/* Badges / Beneficios Rápidos */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600 mb-2" />
                <span className="text-xs font-bold text-green-800 uppercase">Seguridad 100%</span>
                <span className="text-xs text-green-600">Cobro garantizado</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <BoxIcon className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-xs font-bold text-blue-800 uppercase">Cobertura</span>
                <span className="text-xs text-blue-600">Eje Troncal Nacional</span>
              </div>
            </div>

            {/* Price Area */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
              <p className="text-sm text-gray-500 font-semibold mb-1 uppercase tracking-wider">Inversión / Costo</p>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-black text-brand-600">Cotización</span>
                <span className="text-gray-600 font-medium pb-1">personalizada por volumen</span>
              </div>
            </div>

            {/* Descripción */}
            <div className="mb-10">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Descripción del Servicio</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                El modelo perfecto para romper la desconfianza en ventas online. Tu cliente paga en el momento exacto en que recibe el paquete (en efectivo o QR). Nosotros nos encargamos de todo el proceso logístico y de recaudación.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-brand-500" /> Liquidaciones puntuales a tu cuenta</li>
                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-brand-500" /> Recolección en tu almacén</li>
                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-brand-500" /> Seguimiento en tiempo real</li>
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <Link 
                href="/contacto" 
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl text-center transition-colors shadow-lg shadow-brand-500/30 uppercase tracking-wide"
              >
                Solicitar Servicio
              </Link>
              <Link 
                href="/signin" 
                className="flex-1 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-800 font-bold py-4 rounded-xl text-center transition-colors uppercase tracking-wide"
              >
                Cuenta Corporativa
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* ═══ CONFIANZA Y TESTIMONIOS ═════════════════════════════════════════ */}
      <section id="testimonios" className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              La confianza de entregar y cobrar
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Nuestra tasa de entrega efectiva es la más alta del mercado. Diseñado exclusivamente para e-commerce.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
            {/* Tarjeta 70% */}
            <div className="lg:col-span-1 bg-white rounded-3xl p-8 border border-brand-100 shadow-xl shadow-brand-500/5 relative overflow-hidden h-full flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <CheckCircleIcon className="w-40 h-40 text-brand-600" />
              </div>
              <div className="relative z-10 text-center">
                <h3 className="text-6xl font-black text-brand-600 mb-2 drop-shadow-sm">70%</h3>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Efectividad comprobada</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Mientras otros couriers promedian 30-40% en contraentrega, nosotros logramos 70% garantizando que tu producto se entregue y se cobre.
                </p>
              </div>
            </div>
            
            {/* Testimonios */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900">Carlos M.</h5>
                    <p className="text-sm text-gray-500">Tienda de Tecnología (E-commerce)</p>
                  </div>
                  <div className="ml-auto flex text-yellow-400">
                    {[1,2,3,4,5].map(i=><svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "Mande 1500 envíos en junio y me entregaron 1100; los otros 400 no quisieron. La verdad es el mejor % que he tenido con un currier."
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 ml-0 lg:ml-12">
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900">Jonathan</h5>
                    <p className="text-sm text-gray-500">Cliente Final</p>
                  </div>
                  <div className="ml-auto flex text-yellow-400">
                    {[1,2,3,4,5].map(i=><svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                  </div>
                </div>
                <p className="text-gray-700">
                  "Recibí la caja que pedí por internet en la puerta de mi casa, pagando los 699 Bs exactos del valor de la mercadería. Súper seguro y rápido."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Preguntas Frecuentes</h2>
            <p className="text-gray-600">Todo lo que necesitas saber sobre el servicio Contraentrega.</p>
          </div>
          
          <div className="grid gap-4">
            {[
              {
                q: "¿Cuántos días tarda la entrega?",
                a: "En el eje troncal (Santa Cruz, La Paz, Cochabamba) las entregas se realizan en un plazo de 24 a 48 horas hábiles. Para otras ciudades, de 48 a 72 horas."
              },
              {
                q: "¿Hasta qué hora puedo generar una orden para que salga el mismo día?",
                a: "Puedes registrar tus envíos hasta las 17:30. Todos los paquetes registrados antes de esa hora serán despachados esa misma noche."
              },
              {
                q: "¿Cómo recibo el dinero de mis cobros?",
                a: "Realizamos liquidaciones mediante transferencia bancaria directamente a tu cuenta corporativa en los días acordados según tu volumen."
              },
              {
                q: "¿Qué pasa si el cliente final rechaza el paquete?",
                a: "Contamos con un protocolo de devolución. El paquete retorna a nuestras oficinas y te notificamos para la recolección, cobrando únicamente la tarifa base de retorno."
              },
              {
                q: "¿Pueden cobrar mediante QR al momento de la entrega?",
                a: "Sí, nuestros repartidores están equipados para generar cobros mediante código QR al instante, garantizando total seguridad sin manejar efectivo."
              }
            ].map((faq, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow">
                <h4 className="text-lg font-bold text-gray-900 mb-2 flex items-start gap-3">
                  <span className="text-brand-600 font-black">Q.</span> {faq.q}
                </h4>
                <p className="text-gray-600 pl-8">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
