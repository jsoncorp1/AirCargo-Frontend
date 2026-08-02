"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircleIcon } from "@/icons";

const CAROUSEL_IMAGES = [
  "/images/envio_esporadico_hero_real.png",
  "/images/aircargo_hero_premium2.png", // Reusing some good images as placeholders
  "/images/aircargo_worker_hero.png",
];

const TESTIMONIALS = [
  {
    id: 1,
    name: "Roberto Suárez",
    store: "Emprendedor Independiente",
    text: "No hago envíos todos los días, así que este servicio me queda como anillo al dedo. Solo pago cuando los necesito y siempre cumplen.",
    rating: 5,
  },
  {
    id: 2,
    name: "Valeria Guzmán",
    store: "Ventas por Facebook",
    text: "Excelente servicio para cuando tengo que mandar paquetes sueltos a mis familiares o clientes rápidos en otros departamentos.",
    rating: 5,
  },
  {
    id: 3,
    name: "Andrés Pinto",
    store: "Artesanías AP",
    text: "El recojo a domicilio es lo mejor. Vienen hasta mi taller, se llevan el paquete y me avisan cuando ya se entregó. Recomendadísimo.",
    rating: 5,
  }
];

export default function EnvioEsporadicoPage() {
  const [activeImage, setActiveImage] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(1);

  // Auto-play para el carrusel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const toggleFaq = (index: number) => {
    if (openFaq === index) setOpenFaq(null);
    else setOpenFaq(index);
  };

  return (
    <div className="bg-[#f4f4f4] min-h-screen font-sans text-gray-800 antialiased pt-16 md:pt-20 lg:pt-24 pb-16 lg:pb-20">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        
        {/* DISEÑO ESTILO "PRODUCTO E-COMMERCE" */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* LADO IZQUIERDO: Carrusel de Fotos del Proceso */}
            <div className="relative p-4 md:p-6 bg-gray-50 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-md bg-white">
                {CAROUSEL_IMAGES.map((img, index) => (
                  <Image 
                    key={index}
                    src={img}
                    alt={`Proceso Esporádico ${index + 1}`}
                    fill
                    className={`object-cover object-top transition-opacity duration-1000 ${activeImage === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    priority={index === 0}
                  />
                ))}
                <div className="absolute top-4 left-4 z-20 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                  Rápido y Fácil
                </div>
              </div>
              
              {/* Miniaturas (Thumbnails) */}
              <div className="flex gap-2 md:gap-3 mt-4 md:mt-6 w-full justify-center">
                {CAROUSEL_IMAGES.map((img, index) => (
                  <button 
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`relative w-12 h-12 md:w-16 md:h-16 rounded-md overflow-hidden border-2 transition-all ${activeImage === index ? 'border-brand-600 scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <Image src={img} alt="Miniatura" fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* LADO DERECHO: Detalles del Servicio */}
            <div className="p-5 md:p-8 lg:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  ))}
                </div>
                <span className="text-gray-500 text-sm font-semibold">(4.8/5 Excelente)</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">
                Envío Esporádico
              </h1>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                El servicio ideal para emprendedores o personas naturales que necesitan realizar envíos de forma puntual. Soluciones rápidas y confiables a nivel nacional sin ataduras ni contratos mensuales. Tú solo pagas por lo que envías.
              </p>

              <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 uppercase tracking-wider text-sm">Funcionamiento del Servicio</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700"><strong>1. Solicitud:</strong> Programas el recojo mediante nuestro formulario web o simplemente vía WhatsApp.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700"><strong>2. Recolección:</strong> Un mensajero de AirCargo Express pasa por tu domicilio o negocio a recoger el paquete.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700"><strong>3. Tránsito Seguro:</strong> Transportamos tu encomienda con el máximo cuidado hacia su ciudad de destino.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700"><strong>4. Entrega Exitosa:</strong> Entregamos el paquete en las manos del destinatario final, notificándote al instante.</p>
                  </li>
                </ul>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-2">Consideraciones Clave</h3>
                <p className="text-sm text-gray-600 border-l-4 border-yellow-400 pl-3">
                  <strong>Flexibilidad total:</strong> No exigimos un mínimo de envíos al mes. Ideal para tiendas emergentes o necesidades particulares.
                </p>
              </div>

              <Link
                href="/contacto"
                className="w-full inline-block text-center bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-lg shadow-brand-500/30 uppercase tracking-wide text-sm"
              >
                Cotizar Envío Ahora
              </Link>
            </div>
          </div>
        </div>

        {/* OPINIONES (Testimonios para dar confianza) */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Lo que opinan nuestros clientes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  ))}
                </div>
                <p className="text-gray-600 italic mb-6 flex-1">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-xs text-brand-600 font-semibold uppercase tracking-wider">{testimonial.store}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PREGUNTAS FRECUENTES (FAQ Improvisado) */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-12 mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Preguntas Frecuentes (FAQ)</h2>
          
          <div className="space-y-4">
            
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => toggleFaq(1)} className="w-full flex justify-between items-center p-5 sm:p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                <h3 className="font-bold text-gray-900 text-left pr-8 text-sm sm:text-base">1. ¿Necesito firmar un contrato mensual?</h3>
                <svg className={`w-5 h-5 flex-shrink-0 text-brand-600 transform transition-transform ${openFaq === 1 ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {openFaq === 1 && (
                <div className="p-5 sm:p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Absolutamente no. El servicio esporádico está pensado para que envíes paquetes puntuales únicamente cuando lo necesites, sin cobros recurrentes ni compromisos a largo plazo.</p>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => toggleFaq(2)} className="w-full flex justify-between items-center p-5 sm:p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                <h3 className="font-bold text-gray-900 text-left pr-8 text-sm sm:text-base">2. ¿Hacen recojos a domicilio de mis paquetes?</h3>
                <svg className={`w-5 h-5 flex-shrink-0 text-brand-600 transform transition-transform ${openFaq === 2 ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {openFaq === 2 && (
                <div className="p-5 sm:p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Sí. Parte de nuestra excelencia logística incluye pasar a recoger tu encomienda por la puerta de tu hogar o negocio. Solo debes coordinar el recojo con nuestro equipo.</p>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => toggleFaq(3)} className="w-full flex justify-between items-center p-5 sm:p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                <h3 className="font-bold text-gray-900 text-left pr-8 text-sm sm:text-base">3. ¿Cómo sé cuánto me costará el envío?</h3>
                <svg className={`w-5 h-5 flex-shrink-0 text-brand-600 transform transition-transform ${openFaq === 3 ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {openFaq === 3 && (
                <div className="p-5 sm:p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">El costo se calcula en base al peso, dimensiones del paquete y la ciudad de destino. Te invitamos a usar el botón de "Cotizar Envío Ahora" para recibir un precio exacto al instante por WhatsApp.</p>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => toggleFaq(4)} className="w-full flex justify-between items-center p-5 sm:p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                <h3 className="font-bold text-gray-900 text-left pr-8 text-sm sm:text-base">4. ¿Qué tipo de artículos NO puedo enviar?</h3>
                <svg className={`w-5 h-5 flex-shrink-0 text-brand-600 transform transition-transform ${openFaq === 4 ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {openFaq === 4 && (
                <div className="p-5 sm:p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Por medidas de seguridad nacional e internacional, no transportamos sustancias inflamables, material perecedero sin empaque adecuado, armas, explosivos, dinero en efectivo o joyas de alto valor sin declarar.</p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
