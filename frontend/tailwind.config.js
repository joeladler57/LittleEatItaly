/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                fontFamily: {
                        anton: ['Anton', 'sans-serif'],
                        mono: ['Space Mono', 'monospace'],
                },
                colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        pizza: {
                                black: '#050505',
                                red: '#FF1F1F',
                                white: '#FAFAFA',
                                dark: '#262626',
                                muted: '#404040',
                        },
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        }
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                keyframes: {
                        'accordion-down': {
                                from: { height: '0' },
                                to: { height: 'var(--radix-accordion-content-height)' }
                        },
                        'accordion-up': {
                                from: { height: 'var(--radix-accordion-content-height)' },
                                to: { height: '0' }
                        },
                        'marquee': {
                                '0%': { transform: 'translateX(0%)' },
                                '100%': { transform: 'translateX(-50%)' }
                        },
                        'float': {
                                '0%, 100%': { transform: 'translateY(0)' },
                                '50%': { transform: 'translateY(-10px)' }
                        },
                        'drip': {
                                '0%': { transform: 'translateY(-100%)' },
                                '100%': { transform: 'translateY(0)' }
                        },
                        'glitch': {
                                '0%': { transform: 'translate(0)' },
                                '20%': { transform: 'translate(-2px, 2px)' },
                                '40%': { transform: 'translate(-2px, -2px)' },
                                '60%': { transform: 'translate(2px, 2px)' },
                                '80%': { transform: 'translate(2px, -2px)' },
                                '100%': { transform: 'translate(0)' }
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        'marquee': 'marquee 20s linear infinite',
                        'float': 'float 3s ease-in-out infinite',
                        'drip': 'drip 0.5s ease-out forwards',
                        'glitch': 'glitch 0.3s ease-in-out'
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};
