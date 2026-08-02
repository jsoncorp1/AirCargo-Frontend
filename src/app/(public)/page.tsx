import React from "react";
import { HeroSection } from "@/components/public/home/HeroSection";
import { FloatingCards } from "@/components/public/home/FloatingCards";
import { ServicesSection } from "@/components/public/home/ServicesSection";
import { ContactStrip } from "@/components/public/home/ContactStrip";

export default function HomePage() {
  return (
    <div className="bg-[#f4f4f4] min-h-screen font-sans text-gray-800 antialiased">
      <HeroSection />
      <FloatingCards />
      <ServicesSection />
      <ContactStrip />
    </div>
  );
}
