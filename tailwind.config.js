/** @type {import('tailwindcss').Config} */
export default {
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}"
]

,
  theme: {
    extend: {
      colors: {
        darkbg: '#0a0a0a',
        cardbg: '#111111',
        secondary: '#1a1a1a',
        ethblue: '#3C3CFF',
        'ethblue-hover': '#3232E5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
