/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        heading: ['Rajdhani', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
        body: ['Outfit', 'sans-serif'],
      },
      colors: {
        void: { 950: '#02020A', 900: '#05050F', 800: '#080814', 700: '#0D0D1E', 600: '#12122A' },
        neon: { red: '#FF1744', orange: '#FF6D00', amber: '#FFB300', cyan: '#00E5FF', green: '#00E676' },
        plasma: { 400: '#FF4569', 500: '#FF1744', 600: '#D50000' },
        electric: { 400: '#40C4FF', 500: '#00B0FF', 600: '#0091EA' },
      },
      boxShadow: {
        'neon-red': '0 0 20px rgba(255,23,68,0.5), 0 0 60px rgba(255,23,68,0.2)',
        'neon-cyan': '0 0 20px rgba(0,229,255,0.4), 0 0 60px rgba(0,229,255,0.1)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      animation: {
        'flicker': 'flicker 4s linear infinite',
        'radar': 'radar 3s linear infinite',
        'data-stream': 'dataStream 20s linear infinite',
        'threat-pulse': 'threatPulse 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'count-up': 'countUp 0.8s ease forwards',
      },
      keyframes: {
        flicker: {
          '0%,100%': { opacity: 1 }, '92%': { opacity: 1 }, '93%': { opacity: 0.8 },
          '94%': { opacity: 1 }, '96%': { opacity: 0.9 }, '97%': { opacity: 1 },
        },
        radar: { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        dataStream: { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-50%)' } },
        threatPulse: {
          '0%,100%': { boxShadow: '0 0 20px rgba(255,23,68,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(255,23,68,0.8), 0 0 80px rgba(255,23,68,0.3)' },
        },
        slideIn: { from: { opacity: 0, transform: 'translateY(30px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        countUp: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
