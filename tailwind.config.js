/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        skySoft: '#E0F2FE',
        slateDark: '#1E293B',
        primaryBlue: '#BFDBFE',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      maxWidth: {
        'screen-480': '480px',
      },
    },
  },
  plugins: [],
}
