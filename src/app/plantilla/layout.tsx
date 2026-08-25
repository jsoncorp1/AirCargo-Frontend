"use client";

import React from "react";
import Backdrop from "@/layout/Backdrop";
import { useSidebar } from "@/context/SidebarContext";
import TemplateSidebar from "./_components/TemplateSidebar";
import TemplateHeader from "./_components/TemplateHeader";

/**
 * Layout aislado para la referencia de la plantilla TailAdmin.
 * No usa AuthContext ni redirige por rol: es una zona de consulta
 * independiente del flujo real del sistema.
 */
export default function PlantillaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      <TemplateSidebar />
      <Backdrop />
      <div
        className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        <TemplateHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
