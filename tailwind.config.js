/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // If you have a main index.html for testing the editor UI
    "./src/**/*.{js,ts,jsx,tsx}",
    // "./src/popup/popup.html", // If using a popup
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} 