export type Theme = {
  name: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
};

export const themes: Record<string, Theme> = {
  light: {
    name: "light",
    colors: {
      background: "hsl(0 0% 100%)",
      foreground: "hsl(222.2 84% 4.9%)",
      primary: "hsl(222.2 47.4% 11.2%)",
      secondary: "hsl(210 40% 96.1%)",
      accent: "hsl(210 40% 96.1%)",
      muted: "hsl(210 40% 96.1%)",
    },
    borderRadius: {
      sm: "0.3rem",
      md: "0.5rem",
      lg: "0.7rem",
    },
  },
  dark: {
    name: "dark",
    colors: {
      background: "hsl(222.2 84% 4.9%)",
      foreground: "hsl(210 40% 98%)",
      primary: "hsl(210 40% 98%)",
      secondary: "hsl(217.2 32.6% 17.5%)",
      accent: "hsl(217.2 32.6% 17.5%)",
      muted: "hsl(217.2 32.6% 17.5%)",
    },
    borderRadius: {
      sm: "0.3rem",
      md: "0.5rem",
      lg: "0.7rem",
    },
  },
};
