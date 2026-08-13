"use client";

import React from "react";
import { useParams } from "next/navigation";
import ManifestDetailView from "@/components/manifiestos/ManifestDetailView";

export default function AdminManifiestoDetallePage() {
  const params = useParams();
  return <ManifestDetailView manifestId={params.id as string} basePath="/admin/manifiestos" />;
}
