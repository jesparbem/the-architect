export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#0a0f1e',
          2: '#0d1528',
          3: '#111c35',
          4: '#162040',
        },
        neon: {
          green:  '#00ff88',
          blue:   '#38bdf8',
          purple: '#a78bfa',
          red:    '#ff4d6d',
          gold:   '#fbbf24',
          pink:   '#f472b6',
        },
      },
      boxShadow: {
        'glow-green':  '0 0 20px rgba(0,255,136,0.25), 0 0 40px rgba(0,255,136,0.1)',
        'glow-red':    '0 0 20px rgba(255,77,109,0.25), 0 0 40px rgba(255,77,109,0.1)',
        'glow-blue':   '0 0 20px rgba(56,189,248,0.25), 0 0 40px rgba(56,189,248,0.1)',
        'glow-purple': '0 0 20px rgba(167,139,250,0.25)',
        'card':        '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        'card-hover':  '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'card-gradient':     'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
        'green-glow':        'radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.15) 0%, transparent 60%)',
        'red-glow':          'radial-gradient(ellipse at 50% 0%, rgba(255,77,109,0.15) 0%, transparent 60%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan':       'scan 4s linear infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
      },
      keyframes: {
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
