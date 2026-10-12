"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTACT_EMAIL, CONTACT_FALLBACK_MAILTO } from "../../bienvenue/content";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const target = CONTACT_EMAIL ?? CONTACT_FALLBACK_MAILTO;

  return (
    <form
      className="panel-premium mt-6 space-y-4 rounded-2xl p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const subject = encodeURIComponent(String(fd.get("subject") ?? "Contact WINE"));
        const body = encodeURIComponent(
          `Nom : ${fd.get("name")}\nEmail : ${fd.get("email")}\n\n${fd.get("message")}`
        );
        window.location.href = `mailto:${target}?subject=${subject}&body=${body}`;
        setSent(true);
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="contact-name">Nom</Label>
        <Input id="contact-name" name="name" required autoComplete="name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-email">Email</Label>
        <Input id="contact-email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-subject">Objet</Label>
        <Input id="contact-subject" name="subject" required defaultValue="Question sur WINE" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Message</Label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
      </div>
      <Button type="submit" size="lg">
        Ouvrir mon client mail
      </Button>
      {sent && (
        <p role="status" className="text-sm text-muted-foreground">
          Si votre messagerie ne s&apos;ouvre pas, écrivez-nous à{" "}
          <a href={`mailto:${target}`} className="text-primary underline underline-offset-4">
            {target}
          </a>
          .
        </p>
      )}
    </form>
  );
}
