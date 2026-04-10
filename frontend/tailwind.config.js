/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "neon-blue": "#00ffff",
        "neon-pink": "#ff69b4",
      },
    },
  },
  plugins: [],
};
