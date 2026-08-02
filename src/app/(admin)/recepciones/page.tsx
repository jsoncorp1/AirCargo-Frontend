"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ArticleReceiptsTable from "@/components/recepciones/ArticleReceiptsTable";

export default function RecepcionesPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Recepciones de Artículos" />
      <div className="space-y-6">
        <ArticleReceiptsTable />
      </div>
    </div>
  );
}
