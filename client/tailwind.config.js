/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0E7C7B',
        navy: '#0F3460',
        amber: '#D4A017',
        danger: '#C0392B',
        success: '#27AE60',
        'off-white': '#F8FAFB',
        'teal-tint': '#EDF7F7',
        'near-black': '#1A1A2E',
      }
    }
  },
  plugins: []
};
