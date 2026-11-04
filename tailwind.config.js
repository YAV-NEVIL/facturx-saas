/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF4FD",
          100: "#D7E4FB",
          200: "#B4CEF8",
          300: "#80AEF4",
          400: "#4B88EE",
          500: "#2D68E2",
          600: "#1B4DB8",
          700: "#1840A0",
          800: "#173482",
          900: "#172E69",
          950: "#101D42",
        },
        sidebar: {
          DEFAULT: "#183BB0",
          hover: "#2247C7",
          active: "#3366FF",
          dark: "#122A80",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
