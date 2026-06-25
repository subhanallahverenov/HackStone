/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bcd2ff",
          300: "#8eb4ff",
          400: "#598bff",
          500: "#3563e9",
          600: "#2347c5",
          700: "#1d3aa0",
          800: "#1d3382",
          900: "#1c2f6b",
          950: "#141d40",
        },
        accent: {
          300: "#5ee9c2",
          400: "#22d3a6",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(16,24,40,0.08), 0 1px 2px rgba(16,24,40,0.04)",
        soft: "0 8px 30px rgba(16,24,40,0.08)",
        lift: "0 20px 45px -20px rgba(16,24,40,0.35)",
        glow: "0 18px 60px -15px rgba(53,99,233,0.55)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0px)" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        "fade-up": "fadeUp 0.6s ease both",
      },
    },
  },
  plugins: [],
}
