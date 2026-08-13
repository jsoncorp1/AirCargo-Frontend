"use client";

import React from "react";
import { useParams } from "next/navigation";
import ManifestDetailView from "@/components/manifiestos/ManifestDetailView";

export default function ManifiestoDetallePage() {
  const params = useParams();
  return <ManifestDetailView manifestId={params.id as string} basePath="/manifiestos" />;
}
