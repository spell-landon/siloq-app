/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#42454D',
          foreground: '#F8F8F8',
        },
        accent: {
          DEFAULT: '#4F6FF4',
          foreground: '#FFFFFF',
        },
        background: '#FCFCFC',
        foreground: '#262626',
        muted: {
          DEFAULT: '#F5F5F5',
          foreground: '#737373',
        },
        border: '#E5E5E5',
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#16A34A',
          foreground: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['System'],
        serif: ['System'],
      },
    },
  },
  plugins: [],
}

