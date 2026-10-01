"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { switchOrganization } from "@/lib/actions/session";

export function SwitchOrgButton({ orgId, name }: { orgId: number; name: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(() => switchOrganization(orgId))}>
      Basculer<span className="sr-only"> vers {name}</span>
    </Button>
  );
}
