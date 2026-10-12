"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Exporte les chiffres affichés en CSV (séparateur « ; » pour Excel FR). */
export function ExportButton({ rows, filename }: { rows: (string | number)[][]; filename: string }) {
  const download = () => {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Button variant="outline" size="lg" onClick={download}>
      <Download aria-hidden /> Exporter
    </Button>
  );
}
