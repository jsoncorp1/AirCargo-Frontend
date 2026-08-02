"use client";

import React, { useState } from "react";

const FAQS = [
  {
    q: "¿A qué ciudades de Bolivia realizan envíos con Pago Contra Entrega?",
    a: (
      <>
        <p className="mb-2">Realizamos envíos con cobro al recibir el paquete en las siguientes coberturas a nivel nacional:</p>
        <p className="mb-2"><strong>Eje Troncal y Capitales:</strong> La Paz, Cochabamba, Santa Cruz, Oruro, Potosí, Sucre, Tarija y Cobija.</p>
        <p className="mb-2"><strong>Provincias y Puntos Estratégicos:</strong> Riberalta, Guayaramerín, Rurrenabaque y Yacuiba.</p>
        <p className="italic text-[#7A7D88]">Si tu localidad no figura en la lista, déjanos tus datos para verificar la ruta.</p>
      </>
    )
  },
  {
    q: "¿Cuánto tiempo tarda en llegar mi pedido?",
    a: "El tiempo estimado de entrega a nivel nacional es de 24 a 48 horas hábiles a partir del envio realizado. Te mantendremos informado sobre el estado de tu paquete en tránsito en los días hábiles."
  },
  {
    q: "¿Qué métodos de pago puedo utilizar al momento de recibir mi paquete?",
    a: (
      <>
        <p className="mb-2">Para tu mayor comodidad y seguridad, puedes pagar al mensajero en el momento exacto de la entrega mediante:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Efectivo</strong> (te recomendamos tener el monto exacto).</li>
          <li><strong>Transferencia QR</strong> (rápido, directo y desde cualquier aplicación bancaria de Bolivia).</li>
        </ul>
      </>
    )
  },
  {
    q: "¿Cómo coordinan la entrega de mi paquete?",
    a: "Nos comunicamos con su cliente vía llamada telefónica y mensaje de WhatsApp para confirmar su ubicación exacta y la hora de la entrega. Nuestro equipo hará todo el seguimiento necesario para asegurar que se entregue su pedido sin contratiempos."
  },
  {
    q: "¿Debo pagar algo por adelantado para pago contra entrega?",
    a: "No. El gran beneficio del servicio Contra Entrega es que el cliente final solo abona el dinero en el momento en que recibe el producto en sus manos, garantizando total confianza en la transacción."
  },
  {
    q: "¿Qué pasa si el cliente no contesta o no está en su domicilio cuando llegue el mensajero?",
    a: "En esta situación el mensajero reprograma la entrega al día siguiente o le pregunta al cliente qué fecha posterior puede hacer su entrega."
  }
];

export function FAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    if (openFaq === index) setOpenFaq(null);
    else setOpenFaq(index);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <h2 className="text-3xl font-bold text-[#040F21] mb-12 text-center">Preguntas Frecuentes (FAQ)</h2>
        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <div key={index} className="border border-[#E7EAF0] rounded bg-white overflow-hidden transition-all">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex justify-between items-center p-6 bg-white hover:bg-[#F8F9FB] transition-colors text-left"
              >
                <h3 className="font-bold text-[#040F21] pr-8">{index + 1}. {faq.q}</h3>
                <svg className={`w-5 h-5 flex-shrink-0 text-[#040F21] transform transition-transform duration-300 ${openFaq === index ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="p-6 pt-0 text-[#565A6B] border-t border-[#E7EAF0] mt-2">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
