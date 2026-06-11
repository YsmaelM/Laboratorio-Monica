/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        // Primary brand — deep medical teal/blue
        primary: {
          50:  "#eff8ff",
          100: "#dbeefe",
          200: "#bfe0fd",
          300: "#93cbfc",
          400: "#5aaef8",
          500: "#3392f3",
          600: "#1d74e8",
          700: "#165ed5",
          800: "#184cac",
          900: "#1a4388",
          950: "#152a54",
        },
        // Accent — vibrant cyan for interactive elements
        accent: {
          50:  "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        // Surface colours for dark UI
        surface: {
          950: "#060c18",
          900: "#0a1628",
          800: "#0f2040",
          700: "#16305e",
          600: "#1e4080",
          500: "#2952a3",
        },
        // Result flags
        flag: {
          high:   "#ef4444",
          low:    "#3b82f6",
          normal: "#22c55e",
        },
      },
      borderRadius: {
        xl:  "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        "glow-primary": "0 0 20px rgba(51, 146, 243, 0.25)",
        "glow-accent":  "0 0 20px rgba(6, 182, 212, 0.20)",
        "card": "0 4px 24px rgba(0, 0, 0, 0.4)",
      },
      animation: {
        "fade-in":    "fadeIn 0.2s ease-out",
        "slide-up":   "slideUp 0.25s ease-out",
        "slide-down": "slideDown 0.2s ease-out",
        "pulse-dot":  "pulseDot 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%":   { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.4" },
        },
      },
    },
  },
  plugins: [],
};
