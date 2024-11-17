import type { Theme } from "@/types/theme";

export function createTheme(theme: Theme): Theme {
  return theme;
}

export const theme = createTheme({
  borderRadius: {
    lg: "0.5rem",
    md: "0.375rem",
    sm: "0.25rem",
  },
  colors: {
    primary: "hsl(222.2 47.4% 11.2%)",
    muted: "hsl(210 40% 96.1%)",
    background: "hsl(0 0% 100%)",
  },
});
