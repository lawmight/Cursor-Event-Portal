import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cursor: {
          purple: "#7c3aed",
          "purple-dark": "#5b21b6",
          "purple-light": "#a78bfa",
        },
      },
    },
  },
  plugins: [],
};
export default config;
