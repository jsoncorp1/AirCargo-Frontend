import React from "react";
import { HeroContraentrega } from "@/components/public/contraentrega/HeroContraentrega";
import { ProcessTimeline } from "@/components/public/contraentrega/ProcessTimeline";
import { SuccessStories } from "@/components/public/contraentrega/SuccessStories";
import { FAQ } from "@/components/public/contraentrega/FAQ";

export default function ContraentregaPage() {
  return (
    <div className="bg-white font-sans text-[#565A6B] antialiased">
      <HeroContraentrega />
      <ProcessTimeline />
      <SuccessStories />
      <FAQ />
    </div>
  );
}
