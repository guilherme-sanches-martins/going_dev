export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#0B0F14', // topo botões escuros
          700: '#1A2430',
          100: '#EAF1FF', // fundo azulado claro
        },
        grayb: {
          50:  '#F7F7F8',
          100: '#EFEFF1',
          200: '#E5E7EB',
          400: '#9CA3AF',
          600: '#4B5563',
        },
        ok:   '#22C55E',
        bad:  '#EF4444',
      },
      borderRadius: {
        xl2: '1rem',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,.06)',
      },
    },
  },
  plugins: [],
}
