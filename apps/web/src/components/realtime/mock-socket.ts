// Compatible avec les handlers Socket.io typés (union Socket | MockRealtimeSocket).
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ACK / payloads hétérogènes
type Handler = (...args: any[]) => void;

/** Socket.io minimal pour le mode démo (NEXT_PUBLIC_USE_MOCKS). */
export class MockRealtimeSocket {
  private handlers = new Map<string, Set<Handler>>();
  connected = false;
  private timers: number[] = [];

  constructor(private _organizationId: number) {
    void this._organizationId;
    window.setTimeout(() => {
      this.connected = true;
      this.emitLocal("connect");
      this.emitToHandlers("connect");
    }, 300);

    this.timers.push(
      window.setInterval(() => {
        this.emitToHandlers("typing", { channel_id: "mock-general", user_id: 2 });
      }, 12_000)
    );

    this.timers.push(
      window.setInterval(() => {
        this.emitToHandlers("notification:new", {
          type: "task.reminder",
          payload: { title: "Relire le devis client", task_id: 1 },
          at: new Date().toISOString(),
        });
      }, 45_000)
    );
  }

  on(event: string, fn: Handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(fn);
  }

  off(event: string, fn: Handler) {
    this.handlers.get(event)?.delete(fn);
  }

  close() {
    this.timers.forEach((t) => window.clearInterval(t));
    this.connected = false;
    this.emitToHandlers("disconnect");
  }

  timeout(_ms: number) {
    return this;
  }

  emit(event: string, payload?: unknown, ack?: (err: Error | null, res?: unknown) => void) {
    if (event === "channel:list" && ack) {
      ack(null, {
        ok: true,
        channels: [
          {
            id: "mock-general",
            name: "général",
            type: "public",
            member_ids: [1, 2, 3],
            unread_count: 0,
          },
        ],
      });
      return this;
    }
    if (event === "channel:history" && ack) {
      ack(null, {
        ok: true,
        messages: [
          {
            _id: "m1",
            channel_id: (payload as { channel_id: string })?.channel_id ?? "mock-general",
            user_id: 2,
            body: "Bonjour ! Mode démo temps réel actif.",
            created_at: new Date().toISOString(),
            attachments: [],
          },
        ],
      });
      return this;
    }
    if (event === "message:send" && ack) {
      ack(null, { ok: true, id: crypto.randomUUID() });
      this.emitToHandlers("message:new", {
        _id: crypto.randomUUID(),
        channel_id: (payload as { channel_id: string }).channel_id,
        user_id: 1,
        body: (payload as { body: string }).body,
        created_at: new Date().toISOString(),
        attachments: [],
      });
      return this;
    }
    if (event === "channel:join") {
      const cb = typeof payload === "function" ? (payload as (err: Error | null) => void) : ack;
      cb?.(null);
      this.emitToHandlers("presence:update", { user_id: 2, online: true });
      this.emitToHandlers("presence:update", { user_id: 3, online: false });
      return this;
    }
    if (typeof payload === "function") {
      (payload as (err: Error | null, res?: unknown) => void)(null, { ok: true });
      return this;
    }
    ack?.(null, { ok: true });
    return this;
  }

  private emitToHandlers(event: string, ...args: unknown[]) {
    this.handlers.get(event)?.forEach((fn) => fn(...args));
  }

  private emitLocal(event: string) {
    this.emitToHandlers(event);
  }
}
