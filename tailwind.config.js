/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      screens: {
        'fold': '280px',      // Écrans pliables
        'xs': '375px',        // Petit mobile
        'sm': '640px',        // Mobile
        'md': '768px',        // Tablette
        'lg': '1024px',       // Desktop
        'xl': '1280px',       // Grand desktop
        '2xl': '1536px',      // Très grand écran
        'landscape': {'raw': '(orientation: landscape)'},
      },
    },
  },
  plugins: [],
}