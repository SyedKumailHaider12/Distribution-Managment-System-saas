// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          purple: '#8B5CF6',
          indigo: '#6366F1',
          blue: '#3B82F6',
        },
        background: {
          dark1: '#0B1120',
          dark2: '#111827',
          dark3: '#1F2937',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      borderRadius: {
        xl: '24px',
        lg: '16px',
      },
    },
  },
  plugins: [],
};
