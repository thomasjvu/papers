/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,mdx}', './shared/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        'mona-sans': ['Mona Sans', 'sans-serif'],
        'hubot-sans': ['Hubot Sans', 'sans-serif'],
        'maple-mono': ['MapleMono', 'monospace'],
      },
      colors: {
        dark: {
          primary: '#FF85A1',
          secondary: '#FFC4DD',
          accent: '#FF4989',
          background: '#0B0D0F',
          card: '#111317',
          border: '#374151',
          text: '#F8FAFC',
          muted: '#94A3B8',
        },
        light: {
          primary: '#678D58',
          secondary: '#A3C9A8',
          accent: '#557153',
          background: '#FAFBF9',
          card: '#FFFFFF',
          border: '#D1D5DB',
          text: '#1F2937',
          muted: '#6B7280',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-in': 'slideIn 0.3s ease forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
