/**
 * Dr. Lokmandas Public School — brand system.
 *
 * Colours and type pulled from the live site
 * (lockmandas-school-erp-web.vercel.app): deep royal navy + gold, with
 * Libre Franklin for display headings and DM Sans for body text.
 */

export const colors = {
  // core brand
  navy: "#171065", // primary — deep royal indigo
  ink: "#191850", // body text / headings on light
  blue: "#244f9e", // links, secondary accents
  gold: "#ffd400", // primary accent / buttons
  accent: "#ffb800",
  amber: "#f1b800",

  // surfaces
  cream: "#fffdf2",
  sky: "#fff5b8",
  white: "#ffffff",
  surface: "#ffffff",
  surfaceAlt: "#f4f5fb", // light pill / chip background
  field: "#ffffff",

  // status
  red: "#d9253f",
  green: "#43833f",
  highlight: "#71e1b5",

  // text
  muted: "#64647c",
  line: "#e6e4f0", // hairline borders on light
  lineWarm: "#e5dfb7",

  // on-navy
  onNavy: "#ffffff",
  onNavyMuted: "rgba(255,255,255,0.72)",
  onNavyFaint: "rgba(255,255,255,0.14)",
} as const;

/** Gradient stops for the signature navy hero panel. */
export const gradients = {
  navy: ["#1b1470", "#171065", "#120b4e"] as const,
  navySoft: ["#244f9e", "#171065"] as const,
  gold: ["#ffe14d", "#ffd400", "#ffb800"] as const,
};

export const radius = {
  sm: 8,
  md: 13, // matches the site's button radius
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const shadow = {
  card: {
    shadowColor: "#171065",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  raised: {
    shadowColor: "#171065",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
} as const;

/** Font family keys — loaded in the root layout via @expo-google-fonts. */
// DM Sans ships 400 / 500 / 700 (no 600), so "semibold" body maps to Medium
// and strong emphasis to Bold. Headings use Libre Franklin's full weight range.
export const fonts = {
  display: "LibreFranklin_800ExtraBold",
  displaySemi: "LibreFranklin_600SemiBold",
  heading: "LibreFranklin_700Bold",
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodySemi: "DMSans_500Medium",
  bodyBold: "DMSans_700Bold",
} as const;

/** Reusable text styles. */
export const type = {
  // Big editorial display heading (e.g. "Choose your portal.")
  display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.ink },
  h1: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 30, color: colors.ink },
  h2: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 26, color: colors.ink },
  h3: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.ink },
  bodyMuted: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted },
  small: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17, color: colors.muted },
  // Gold small-caps section label (e.g. "SCHOOL ERP PORTAL")
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    letterSpacing: 1.6,
    textTransform: "uppercase" as const,
  },
  button: { fontFamily: fonts.bodyBold, fontSize: 15.5, letterSpacing: 0.3 },
  stat: { fontFamily: fonts.display, fontSize: 30, color: colors.ink },
} as const;

export const theme = { colors, gradients, radius, spacing, shadow, fonts, type };
export type Theme = typeof theme;
