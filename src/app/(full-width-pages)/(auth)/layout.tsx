import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-gray-950 lg:grid items-center hidden relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/images/hero-cod.png')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
            <div className="relative items-center justify-center flex z-10">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              <GridShape />
              <div className="flex flex-col items-center max-w-sm px-8 text-center">
                <Link href="/" className="block mb-6 transition-transform hover:scale-105">
                  <div className="relative w-56 h-16">
                    <Image
                      src="/images/logo/logoaircargoblanco.png"
                      alt="AirCargo Express"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </Link>
                <p className="text-gray-300 dark:text-white/70 text-lg leading-relaxed">
                  Plataforma integral para la gestión de envíos, contraentrega y logística corporativa en toda Bolivia.
                </p>
              </div>
            </div>
          </div>
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
