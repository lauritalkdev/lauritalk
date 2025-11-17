// constants/theme.ts

export const COLORS = {
  gold: "#D4AF37",
  black: "#000000",
  forestGreen: "#228B22",
  white: "#FFFFFF",
  gray: "#EEEEEE",

  // ✅ Add light and dark theme colors
  light: {
    background: "#FFFFFF",
    text: "#000000",
    icon: "#000000",
    border: "#D4AF37",
    accent: "#228B22",
  },

  dark: {
    background: "#000000",
    text: "#FFFFFF",
    icon: "#D4AF37",
    border: "#D4AF37",
    accent: "#228B22",
  },
};

// Optional: keep THEME for default usage
export const THEME = {
  background: COLORS.white,
  primary: COLORS.gold,
  accent: COLORS.forestGreen,
  text: COLORS.black,
  buttonText: COLORS.white,
};
