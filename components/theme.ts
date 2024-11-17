type Theme = {
  borderRadius: {
    lg: string;
    md: string;
    sm: string;
  };
  colors: {
    primary: string;
    muted: string;
    background: string;
  };
};

export function createTheme(theme: Theme): Theme {
  return theme;
}
