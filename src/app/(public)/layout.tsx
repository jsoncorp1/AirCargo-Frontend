"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserIcon } from "@/icons";
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
});

import { Navbar } from "@/components/public/Navbar";
import { BottomActionBar } from "@/components/public/BottomActionBar";
import { Footer } from "@/components/public/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showBottomBar = pathname === '/servicios/contraentrega' || pathname === '/servicios/envio-esporadico';

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 ${roboto.className} selection:bg-[#040F21] selection:text-white flex flex-col`}>
      <Navbar />
      {/* pt-[104px] accounts for 56px Top Bar + 48px Sub Nav Bar. pb-20 accounts for bottom action bar when visible */}
      <main className={`flex-1 pt-[104px] ${showBottomBar ? 'pb-20' : ''}`}>
        {children}
      </main>
      <Footer showBottomPadding={showBottomBar} />
      {showBottomBar && <BottomActionBar />}
    </div>
  );
}
