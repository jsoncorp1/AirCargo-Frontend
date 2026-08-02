"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircleIcon } from "@/icons";

const CAROUSEL_IMAGES = [
  "/images/paso1-1.png",
  "/images/paso2-2.png",
  "/images/paso3-3.png",
  "/images/paso4-4.png",
];

const TESTIMONIALS = [
  {
    id: 1,
    name: "María Gómez",
    store: "Boutique La Paz",
    text: "Desde que uso el pago contra entrega con AirCargo, mis ventas aumentaron un 40%. La gente confía más al pagar en su puerta.",
    rating: 5,
  },
  {
    id: 2,
    name: "Carlos Méndez",
    store: "TechStore Bolivia",
    text: "La liquidación del dinero es súper puntual. Reciben el efectivo o el QR y a los días ya lo tengo en mi cuenta. Muy profesionales.",
    rating: 5,
  },
  {
    id: 3,
    name: "Lucía Fernández",
    store: "Cosméticos LF",
    text: "Mis clientes están felices porque los mensajeros de AirCargo son muy amables. El mejor servicio de Courier que he probado.",
    rating: 5,
  }
];

export default function ContraentregaPage() {
  const [activeImage, setActiveImage] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(1);

  // Auto-play para el carrusel (estilo galería de producto)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const toggleFaq = (index: number) => {
    if (openFaq === index) setOpenFaq(null);
    else setOpenFaq(index);
  };

  return (
    <div className="bg-[#f4f4f4] min-h-screen font-sans text-gray-800 antialiased pt-16 pb-12">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">

        {/* DISEÑO ESTILO "PRODUCTO E-COMMERCE" MEJORADO (COMPACTO Y GRANDE) */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-12">

          {/* FILA 1: Carrusel y Descripción Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-gray-100">
            {/* LADO IZQUIERDO: Carrusel de Fotos del Proceso (Más grande - 7 columnas) */}
            <div className="lg:col-span-7 relative p-6 bg-gray-50 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden shadow-md bg-white">
                {CAROUSEL_IMAGES.map((img, index) => (
                  <Image
                    key={index}
                    src={img}
                    alt={`Proceso Contraentrega ${index + 1}`}
                    fill
                    className={`object-cover object-center transition-opacity duration-1000 ${activeImage === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    priority={index === 0}
                  />
                ))}
                <div className="absolute top-4 left-4 z-20 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                  Proceso Real
                </div>
              </div>

              {/* Miniaturas (Thumbnails) */}
              <div className="flex gap-3 mt-6 w-full justify-center">
                {CAROUSEL_IMAGES.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`relative w-14 h-14 lg:w-16 lg:h-16 rounded-md overflow-hidden border-2 transition-all ${activeImage === index ? 'border-brand-600 scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <Image src={img} alt="Miniatura" fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* LADO DERECHO: Detalles (5 columnas) */}
            <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <span className="text-gray-500 text-sm font-semibold">(4.9/5 basado en 500+ clientes)</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                Servicio Contraentrega
              </h1>

              <p className="text-brand-600 font-bold mb-2">¿Qué es el Servicio de Contraentrega?</p>
              <p className="text-gray-600 mb-6 text-sm lg:text-base leading-relaxed">
                Nosotros nos encargamos de entregar tus productos directamente al cliente y cobrar el pago en el momento de la entrega. Tu empresa no tiene que preocuparse por coordinar repartidores, recibir el dinero o hacer seguimiento a cada entrega. Nosotros realizamos todo el proceso por ti.
              </p>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <p className="text-sm font-bold text-gray-900 mb-3">El cliente puede pagar de forma segura mediante:</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">Bs</div>
                    <p className="text-sm text-gray-700"><strong>Efectivo</strong></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">QR</div>
                    <p className="text-sm text-gray-700"><strong>Transferencia</strong> o pago mediante código QR</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4 border-t border-gray-200 pt-3">
                  Una vez confirmado el pago, realizamos la liquidación correspondiente para que recibas el dinero recaudado de tus ventas.
                </p>
              </div>
            </div>
          </div>

          {/* FILA 2: Cómo Funciona y CTA (Debajo del Carrusel y la Intro) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 bg-white">

            {/* CÓMO FUNCIONA (Debajo del carrusel) */}
            <div className="lg:col-span-7 p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-gray-100">
              <h3 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">¿Cómo funciona?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5">1</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Tú registras el pedido</p>
                    <p className="text-xs text-gray-600 mt-1">Nos envías la información del cliente y del producto que debe entregarse.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5">2</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Recogemos y entregamos</p>
                    <p className="text-xs text-gray-600 mt-1">Nuestro equipo recoge el paquete y lo transporta hasta el domicilio del comprador.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5">3</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Cobramos en la entrega</p>
                    <p className="text-xs text-gray-600 mt-1">Cuando el cliente recibe el pedido, nuestro repartidor cobra el monto acordado.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5">4</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Te transferimos el dinero</p>
                    <p className="text-xs text-gray-600 mt-1">Una vez finalizada la entrega, realizamos la liquidación a tu empresa.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA (Al lado de cómo funciona) */}
            <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-center bg-gray-50">
              <div className="bg-white rounded-xl p-6 border border-brand-100 shadow-sm text-center h-full flex flex-col justify-center">
                <p className="text-gray-600 text-sm mb-6 leading-relaxed flex-1">
                  Solicita una cotización gratuita.
                </p>
                <Link
                  href="/contacto"
                  className="inline-block w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-8 rounded-lg transition-colors shadow-md shadow-brand-500/20 uppercase tracking-wide text-sm"
                >
                  Solicitar Cotización
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* OPINIONES (Testimonios para dar confianza) */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Lo que opinan nuestros comercios aliados</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
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

        {/* PREGUNTAS FRECUENTES (FAQ Completo proporcionado) */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-12 mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Preguntas Frecuentes (FAQ)</h2>

          <div className="space-y-4">

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => toggleFaq(1)} className="w-full flex justify-between items-center p-5 sm:p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                <h3 className="font-bold text-gray-900 text-left pr-8 text-sm sm:text-base">1. ¿A qué ciudades de Bolivia realizan envíos con Pago Contra Entrega?</h3>
                <svg className={`w-5 h-5 flex-shrink-0 text-brand-600 transform transition-transform ${openFaq === 1 ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {openFaq === 1 && (
                <div className="p-5 sm:p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-3">Realizamos envíos con cobro al recibir el paquete en las siguientes coberturas a nivel nacional:</p>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-2"><strong>Eje Troncal y Capitales:</strong> La Paz, Cochabamba, Santa Cruz, Oruro, Potosí, Sucre, Tarija y Cobija.</p>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4"><strong>Provincias y Puntos Estratégicos:</strong> Riberalta, Guayaramerín, Rurrenabaque y Yacuiba.</p>
                  <p className="text-gray-600 text-sm sm:text-base italic">Si tu localidad no figura en la lista, déjame tus datos para verificar la ruta.</p>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => toggleFaq(2)} className="w-full flex justify-between items-center p-5 sm:p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                <h3 className="font-bold text-gray-900 text-left pr-8 text-sm sm:text-base">2. ¿Cuánto tiempo tarda en llegar mi pedido?</h3>
                <svg className={`w-5 h-5 flex-shrink-0 text-brand-600 transform transition-transform ${openFaq === 2 ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {openFaq === 2 && (
                <div className="p-5 sm:p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">El tiempo estimado de entrega a nivel nacional es de <strong>24 a 48 horas hábiles</strong> a partir del envio realizado. Te mantendremos informado sobre el estado de tu paquete en tránsito en los días hábiles.</p>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => toggleFaq(3)} className="w-full flex justify-between items-center p-5 sm:p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                <h3 className="font-bold text-gray-900 text-left pr-8 text-sm sm:text-base">3. ¿Qué métodos de pago puedo utilizar al momento de recibir mi paquete?</h3>
                <svg className={`w-5 h-5 flex-shrink-0 text-brand-600 transform transition-transform ${openFaq === 3 ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {openFaq === 3 && (
                <div className="p-5 sm:p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-3">Para tu mayor comodidad y seguridad, puedes pagar al mensajero en el momento exacto de la entrega mediante:</p>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm sm:text-base">
                    <li><strong>Efectivo</strong> (te recomendamos tener el monto exacto).</li>
                    <li><strong>Transferencia QR</strong> (rápido, directo y desde cualquier aplicación bancaria de Bolivia).</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => toggleFaq(4)} className="w-full flex justify-between items-center p-5 sm:p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                <h3 className="font-bold text-gray-900 text-left pr-8 text-sm sm:text-base">4. ¿Cómo coordinan la entrega de mi paquete?</h3>
                <svg className={`w-5 h-5 flex-shrink-0 text-brand-600 transform transition-transform ${openFaq === 4 ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {openFaq === 4 && (
                <div className="p-5 sm:p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Nos comunicamos con su cliente vía llamada telefónica y mensaje de WhatsApp para confirmar su ubicación exacta y la hora de la entrega. Nuestro equipo hará todo el seguimiento necesario para asegurar que se entregue su pedido sin contratiempos.</p>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => toggleFaq(5)} className="w-full flex justify-between items-center p-5 sm:p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                <h3 className="font-bold text-gray-900 text-left pr-8 text-sm sm:text-base">5. ¿Debo pagar algo por adelantado para pago contra entrega?</h3>
                <svg className={`w-5 h-5 flex-shrink-0 text-brand-600 transform transition-transform ${openFaq === 5 ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {openFaq === 5 && (
                <div className="p-5 sm:p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">No. El gran beneficio del servicio Contra Entrega es que el cliente final solo abona el dinero en el momento en que recibe el producto en sus manos, garantizando total confianza en la transacción.</p>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => toggleFaq(6)} className="w-full flex justify-between items-center p-5 sm:p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                <h3 className="font-bold text-gray-900 text-left pr-8 text-sm sm:text-base">6. ¿Qué pasa si el cliente no contesta o no está en su domicilio?</h3>
                <svg className={`w-5 h-5 flex-shrink-0 text-brand-600 transform transition-transform ${openFaq === 6 ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {openFaq === 6 && (
                <div className="p-5 sm:p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">En esta situación el mensajero reprograma la entrega al día siguiente, o se pone en contacto con el cliente para preguntar qué fecha u hora posterior le resulta más conveniente para recibir su entrega exitosamente.</p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
