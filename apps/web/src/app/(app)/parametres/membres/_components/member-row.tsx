"use client";

import { useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NativeSelect } from "@/components/common/native-select";
import { ToneBadge } from "@/components/common/tone-badge";
import { UserAvatar } from "@/components/common/user-avatar";
import { useRealtime } from "@/components/realtime/realtime-provider";
import { removeMember, updateMemberRole } from "@/lib/actions/members";
import type { Member, Role } from "@/lib/api/types";
import { ago } from "@/lib/format";
import { ROLE } from "@/lib/labels";
import { assignableRoles, canEditMember } from "@/lib/permissions";

export function MemberRow({ member: m, meId, viewerRole }: { member: Member; meId: number; viewerRole: Role }) {
  const { online } = useRealtime();
  const [pending, start] = useTransition();
  const isOnline = m.user_id === meId || online.has(m.user_id);
  const editable = canEditMember(viewerRole, m.role) && m.user_id !== meId;
  return (
    <tr className="hover:bg-muted/60" aria-busy={pending}>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3.5">
          <UserAvatar name={m.name} decorative />
          <div className="leading-tight">
            <p className="font-semibold">{m.name}</p>
            <p className="text-sm text-muted-foreground">{m.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        {editable ? (
          <>
            <label htmlFor={`role-${m.user_id}`} className="sr-only">Rôle de {m.name}</label>
            <NativeSelect
              id={`role-${m.user_id}`}
              className="w-44"
              defaultValue={m.role}
              disabled={pending}
              onChange={(e) =>
                start(async () => {
                  const res = await updateMemberRole(m.user_id, e.target.value as Role);
                  if (res.error) toast.error(res.error);
                  else toast.success(`${m.name} est maintenant ${ROLE[e.target.value as Role].label.toLowerCase()}`);
                })
              }
            >
              {assignableRoles(viewerRole).map((r) => <option key={r} value={r}>{ROLE[r].label}</option>)}
            </NativeSelect>
          </>
        ) : (
          <ToneBadge tone={m.role === "owner" ? "brand" : "neutral"}>{ROLE[m.role].label}</ToneBadge>
        )}
      </td>
      <td className="px-5 py-4">
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-full bg-success" /> Actif
        </span>
      </td>
      <td className="px-5 py-4 text-muted-foreground">{isOnline ? "En ligne" : m.last_active_at ? ago(m.last_active_at) : "—"}</td>
      <td className="px-5 py-4 text-right">
        {editable && (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-md p-2 hover:bg-muted" aria-label={`Actions pour ${m.name}`}>
              <MoreHorizontal aria-hidden className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onSelect={() =>
                  start(async () => {
                    const res = await removeMember(m.user_id);
                    if (res.error) toast.error(res.error);
                    else toast.success(`${m.name} a été retiré·e de l'organisation`);
                  })
                }
              >
                Retirer de l&apos;organisation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  );
}
