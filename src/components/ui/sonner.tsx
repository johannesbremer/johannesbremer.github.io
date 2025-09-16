import type { CSSProperties } from "react";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  const themeValue = theme || "system";
  const resolvedTheme: ToasterProps["theme"] =
    themeValue === "dark" || themeValue === "light" || themeValue === "system"
      ? themeValue
      : "system";
  return (
    <Sonner
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-border": "var(--border)",
          "--normal-text": "var(--popover-foreground)",
        } as CSSProperties
      }
      theme={resolvedTheme}
      {...props}
    />
  );
};

export { Toaster };
