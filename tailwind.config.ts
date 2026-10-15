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
        cv: {
          bg: "#F7F9FC",
          surface: "#FFFFFF",
          "surface-subtle": "#EEF3FA",
          navy: "#173A63",
          blue: "#285F9E",
          "blue-secondary": "#477DB7",
          "blue-muted": "#779BC6",
          "blue-pale": "#DCE9F8",
          "text-main": "#182B43",
          "text-secondary": "#65758B",
          border: "#DCE5EF",
          danger: "#DC2626",
          "danger-subtle": "#FEE2E2",
          success: "#16A34A",
          "success-subtle": "#DCFCE7",
        },
      },
      boxShadow: {
        "cv-sm": "0 1px 3px 0 rgba(23, 58, 99, 0.05), 0 1px 2px -1px rgba(23, 58, 99, 0.05)",
        "cv-md": "0 4px 6px -1px rgba(23, 58, 99, 0.07), 0 2px 4px -2px rgba(23, 58, 99, 0.05)",
        "cv-lg": "0 10px 15px -3px rgba(23, 58, 99, 0.08), 0 4px 6px -4px rgba(23, 58, 99, 0.04)",
        "cv-xl": "0 20px 25px -5px rgba(23, 58, 99, 0.08), 0 8px 10px -6px rgba(23, 58, 99, 0.03)",
      },
      borderRadius: {
        cv: "0.625rem",
      },
    },
  },
  plugins: [],
};

export default config;
