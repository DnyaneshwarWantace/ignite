import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f1ff',
          100: '#e4e5ff',
          200: '#d1d3ff',
          300: '#b4b7ff',
          400: '#8f8fff',
          500: '#6e6aff',
          600: '#5b4fff',
          700: '#4a3aff',
          800: '#3b2dd1',
          900: '#1a0f7a',
        },
      },
    },
  },
  plugins: [],
};

export default config;

