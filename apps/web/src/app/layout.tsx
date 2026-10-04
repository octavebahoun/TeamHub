import type { Metadata } from "next";
import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { InstallPromptProvider } from "@/components/pwa/install-prompt";
import { PushPrompt } from "@/components/pwa/push-prompt";
import { RegisterSW } from "@/components/pwa/register-sw";
import { cn } from "@/lib/utils";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "WINE", template: "%s · WINE" },
  description: "Projets, tâches, échanges et clients au même endroit.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WINE",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={cn(plex.variable, sourceSerif.variable)} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#d63a00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      {/* suppressHydrationWarning : next-themes + extensions navigateur (ex. cz-shortcut-listen) */}
      <body suppressHydrationWarning>
        <ThemeProvider>
          <InstallPromptProvider>
            {children}
            <RegisterSW />
            <PushPrompt />
          </InstallPromptProvider>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
