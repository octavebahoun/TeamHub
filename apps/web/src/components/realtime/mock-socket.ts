// Compatible avec les handlers Socket.io typés (union Socket | MockRealtimeSocket).
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ACK / payloads hétérogènes
type Handler = (...args: any[]) => void;
type Ack = (err: Error | null, res?: unknown) => void;

const MOCK_CHANNELS = [
  {
    id: "mock-projet-201",
    name: "maison-akwa",
    type: "project" as const,
    project_id: 201,
    member_ids: [1, 2, 3],
    unread_count: 1,
  },
  {
    id: "mock-projet-202",
    name: "porto-novo",
    type: "project" as const,
    project_id: 202,
    member_ids: [1, 2, 4],
    unread_count: 0,
  },
  {
    id: "mock-dm-2",
    name: "Koffi Mensah",
    type: "direct" as const,
    project_id: null,
    member_ids: [1, 2],
    unread_count: 0,
  },
];

function mockMessage(channelId: string, senderId: number, body: string, minutesAgo: number) {
  return {
    _id: crypto.randomUUID(),
    channel_id: channelId,
    sender_id: senderId,
    // alias toléré si un composant lit encore user_id
    user_id: senderId,
    body,
    attachments: [] as { path: string; name: string; mime: string; size: number }[],
    read_by: [] as { user_id: number; at: string }[],
    created_at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  };
}

/** Réponses démo variées (mode mock uniquement) — pas un vrai bot métier. */
function mockColleagueReply(userBody: string): string {
  const t = userBody.trim().toLowerCase();
  if (!t) return "Tu voulais dire quelque chose ?";
  if (/^(bonjour|bonsoir|salut|hello|hey)\b/.test(t)) return "Salut ! Comment avance le dossier côté client ?";
  if (/pourquoi/.test(t) && /bien reçu/.test(t)) return "Pardon — c'était une réponse automatique de démo. Je suis plus présent maintenant 🙂";
  if (/merci|thanks/.test(t)) return "Avec plaisir. On se synchronise demain matin ?";
  if (/devis|facture|contravo|momo|paiement/.test(t)) return "OK, je regarde ça sur Contravo et je te dis pour le paiement MoMo.";
  if (/rendez[- ]?vous|réunion|call|visio/.test(t)) return "Je suis dispo jeudi 10h (heure de Cotonou). Ça te va ?";
  if (/\?/.test(t)) return "Bonne question — je vérifie avec Fatou et je te reviens dans l'heure.";
  if (t.length < 12) return "Noté. Tu peux préciser un peu ?";
  const pool = [
    "D'accord, je m'en occupe.",
    "Parfait, on aligne ça avec le sprint en cours.",
    "OK reçu — je mets à jour le Kanban.",
    "Ça marche. Je te ping dès que c'est fait.",
  ];
  return pool[Math.floor(Math.random() * pool.length)]!;
}

/** Socket.io minimal pour le mode démo (NEXT_PUBLIC_USE_MOCKS). */
export class MockRealtimeSocket {
  private handlers = new Map<string, Set<Handler>>();
  connected = true;
  private timers: number[] = [];

  constructor(private _organizationId: number) {
    void this._organizationId;
    this.timers.push(
      window.setTimeout(() => {
        this.emitToHandlers("presence:update", { user_id: 2, online: true });
        this.emitToHandlers("presence:update", { user_id: 3, online: true });
      }, 200)
    );

    this.timers.push(
      window.setInterval(() => {
        this.emitToHandlers("typing", { channel_id: "mock-projet-201", user_id: 2 });
      }, 12_000)
    );

    this.timers.push(
      window.setInterval(() => {
        this.emitToHandlers("notification:new", {
          type: "task.reminder",
          payload: { title: "Relire le devis client", task_id: 301 },
          at: new Date().toISOString(),
        });
      }, 45_000)
    );
  }

  on(event: string, fn: Handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(fn);
    return this;
  }

  off(event: string, fn: Handler) {
    this.handlers.get(event)?.delete(fn);
    return this;
  }

  close() {
    for (const t of this.timers) {
      window.clearTimeout(t);
      window.clearInterval(t);
    }
    this.timers = [];
    this.connected = false;
    this.emitToHandlers("disconnect");
  }

  timeout(_ms: number) {
    return this;
  }

  emit(event: string, payload?: unknown, ack?: Ack) {
    // Socket.io autorise emit(event, ack) sans payload → le callback est en 2e arg.
    const callback: Ack | undefined = typeof payload === "function" ? (payload as Ack) : ack;
    const data = typeof payload === "function" ? undefined : payload;

    if (event === "channel:list") {
      callback?.(null, { ok: true, channels: structuredClone(MOCK_CHANNELS) });
      return this;
    }

    if (event === "channel:history") {
      const channelId = (data as { channel_id?: string } | undefined)?.channel_id ?? "mock-projet-201";
      callback?.(null, {
        ok: true,
        messages: [
          mockMessage(channelId, 2, "Bonjour ! Mode démo temps réel actif — Cotonou 👋", 60),
          mockMessage(channelId, 3, "Les devis Contravo et les paiements MoMo sont mockés pour la démo.", 30),
        ],
      });
      return this;
    }

    if (event === "message:send") {
      const body = (data as { channel_id: string; body: string } | undefined)?.body ?? "";
      const channelId = (data as { channel_id: string } | undefined)?.channel_id ?? "mock-projet-201";
      const msg = mockMessage(channelId, 1, body, 0);
      callback?.(null, { ok: true, id: msg._id });
      this.emitToHandlers("message:new", msg);
      const reply = mockColleagueReply(body);
      this.timers.push(
        window.setTimeout(() => {
          this.emitToHandlers("message:new", mockMessage(channelId, 2, reply, 0));
        }, 700 + Math.floor(Math.random() * 800))
      );
      return this;
    }

    if (event === "channel:join") {
      callback?.(null);
      this.emitToHandlers("presence:update", { user_id: 2, online: true });
      return this;
    }

    if (event === "channel:direct") {
      const userId = (data as { user_id?: number } | undefined)?.user_id ?? 2;
      const channel = {
        id: `mock-dm-${userId}`,
        name: userId === 2 ? "Koffi Mensah" : `Membre ${userId}`,
        type: "direct" as const,
        project_id: null,
        member_ids: [1, userId],
        unread_count: 0,
      };
      callback?.(null, { ok: true, channel });
      return this;
    }

    if (event === "typing") {
      return this;
    }

    callback?.(null, { ok: true });
    return this;
  }

  private emitToHandlers(event: string, ...args: unknown[]) {
    this.handlers.get(event)?.forEach((fn) => fn(...args));
  }
}
