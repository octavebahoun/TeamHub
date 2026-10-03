import type { Metadata } from "next";
import { AuthShell, asideTitle } from "../../_components/auth-shell";
import { ResetForm } from "./_components/reset-form";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token = "", email = "" } = await searchParams;

  return (
    <AuthShell aside={<p className={asideTitle}>Choisissez un mot de passe que vous n&apos;utilisez pas ailleurs.</p>}>
      <ResetForm token={token} email={email} />
    </AuthShell>
  );
}
