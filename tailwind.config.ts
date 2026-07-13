import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sun: "#FFC93C",
        sky: "#3DBDE8",
        grass: "#5FC77E",
        coral: "#FF6F5E",
        plum: "#2D2A4A",
        plumsoft: "#6E6A8E",
        cream: "#FFF8EC",
      },
      fontFamily: {
        display: ["Baloo 2", "sans-serif"],
        body: ["Nunito", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
