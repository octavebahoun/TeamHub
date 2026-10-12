"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeColor } from "./theme-color";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange {...props}>
      {children}
      <ThemeColor />
    </NextThemesProvider>
  );
}
