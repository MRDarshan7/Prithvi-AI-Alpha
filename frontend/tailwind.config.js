/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#effcf3",
          100: "#d8f7e2",
          300: "#8de1aa",
          600: "#1f8f4f",
          700: "#17663a",
          900: "#0b2e19"
        }
      }
    }
  },
  plugins: []
};
