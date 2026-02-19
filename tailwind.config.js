/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            spacing: {
                gutter: '0.75rem',
                panel: '1.25rem',
                section: '1.5rem'
            },
            borderRadius: {
                pill: '999px',
                card: '18px',
                panel: '24px',
                control: '14px'
            },
            colors: {
                brand: {
                    50: '#f0f7ff',
                    100: '#e0effe',
                    200: '#bae0fd',
                    300: '#7cc8fb',
                    400: '#38adf8',
                    500: '#0e91e9',
                    600: '#0274c7',
                    700: '#035ca1',
                    800: '#074e85',
                    900: '#0c426e',
                    950: '#082a49',
                },
            },
            boxShadow: {
                'premium-sm': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
                'premium': '0 12px 20px -5px rgba(0,0,0,0.06), 0 5px 10px -2px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.1)',
                'premium-lg': '0 25px 35px -8px rgba(0,0,0,0.1), 0 12px 15px -5px rgba(0,0,0,0.03), inset 0 1px 1px rgba(255,255,255,0.15)',
                'premium-xl': '0 30px 60px -15px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.08), inset 0 0 0 1px rgba(255,255,255,0.15)',
                'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255,255,255,0.05)',
            },
            animation: {
                'fade-in': 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-down': 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'bounce-subtle': 'bounceSubtle 2s infinite ease-in-out',
                'shimmer': 'shimmer 2s infinite linear',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-12px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(24px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                bounceSubtle: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-3px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                }
            }
        }
    },
    plugins: [],
}
