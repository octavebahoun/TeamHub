"use server";

import { api } from "@/lib/api/client";

export async function linkContravoEntity(input: {
  type: "quote" | "invoice" | "contract" | "deliverable" | "client";
  id: number;
  contravo_id: string;
}) {
  await api("contravo/links", { method: "POST", body: input });
}
