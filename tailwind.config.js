/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
      },
      colors: {
        'belaya': {
          'powder': '#eea09e',
          'medium': '#d17488',
          'bright': '#db58a2',
          'deep': '#c43586',
          'vivid': '#ee3879',
          'primary': '#c43586',
          50: '#fef5f5',
          100: '#fde8e8',
          200: '#fbd5d6',
          300: '#f8b5b8',
          400: '#f38890',
          500: '#ee3879',
          600: '#e61d8f',
          700: '#c43586',
          800: '#a52d6f',
          900: '#882761',
        },
        'brand': {
          '50': '#ffbc93',
          '100': '#ffdcc4',
          '200': '#ffcfaf',
          '300': '#ffb89a',
          '400': '#f5a08c',
          '500': '#e88886',
          '600': '#d8629b',
          '700': '#c04e87',
          '800': '#a83d73',
          '900': '#8f2d5f',
        },
      },
      animation: {
        'belaya-ring': 'belaya-ring 1.4s linear infinite',
        'belaya-pulse': 'belaya-pulse 2s ease-in-out infinite',
        'belaya-bounce': 'belaya-bounce 1.2s ease-in-out infinite',
      },
      keyframes: {
        'belaya-ring': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'belaya-pulse': {
          '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '1' },
          '50%': { transform: 'translate(-50%, -50%) scale(0.92)', opacity: '0.85' },
        },
        'belaya-bounce': {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #c43586 0%, #c43586 100%)',
        'gradient-auth': 'linear-gradient(135deg, #eea09e 0%, #db58a2 50%, #c43586 100%)',
        'gradient-login': 'linear-gradient(135deg, #FAAA83 0%, #ffffff 100%)',
        'gradient-main': 'linear-gradient(135deg, #eea09e 0%, #d17488 100%)',
        'gradient-bright': 'linear-gradient(135deg, #db58a2 0%, #ee3879 100%)',
        'gradient-deep': 'linear-gradient(135deg, #c43586 0%, #db58a2 100%)',
        'gradient-soft': 'linear-gradient(135deg, #fef5f5 0%, #fde8e8 100%)',
        'gradient-tab': 'linear-gradient(135deg, #eea09e 0%, #d17488 50%, #db58a2 100%)',
        'gradient-subtab': 'linear-gradient(135deg, #fef5f5 0%, #fbd5d6 100%)',
      },
    },
  },
  plugins: [],
};
