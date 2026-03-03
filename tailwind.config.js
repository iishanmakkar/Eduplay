/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: 'rgb(var(--background) / <alpha-value>)',
                foreground: 'rgb(var(--foreground) / <alpha-value>)',
                ink: {
                    DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
                    2: 'rgb(var(--ink-2) / <alpha-value>)',
                    3: 'rgb(var(--ink-3) / <alpha-value>)',
                },
                mist: 'rgb(var(--mist) / <alpha-value>)',
                fog: 'rgb(var(--fog) / <alpha-value>)',
                border: 'rgb(var(--border) / <alpha-value>)',
                surface: 'rgb(var(--surface) / <alpha-value>)',
                'fixed-dark': 'rgb(var(--ink-fixed-dark) / <alpha-value>)',
                'fixed-medium': 'rgb(var(--ink-fixed-medium) / <alpha-value>)',
                emerald: {
                    DEFAULT: '#10B981',
                    dark: '#059669',
                    light: '#D1FAE5',
                },
                sky: {
                    DEFAULT: '#0EA5E9',
                    dark: '#0369A1',
                    light: '#E0F2FE',
                },
                amber: {
                    DEFAULT: '#F59E0B',
                    dark: '#B45309',
                    light: '#FEF3C7',
                },
                coral: {
                    DEFAULT: '#F43F5E',
                    dark: '#BE123C',
                    light: '#FFE4E6',
                },
                violet: {
                    DEFAULT: '#8B5CF6',
                    dark: '#6D28D9',
                    light: '#EDE9FE',
                },
            },
            fontFamily: {
                sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
                display: ['var(--font-syne)', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'sm': '0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.05)',
                'md': '0 4px 16px rgba(0,0,0,.09), 0 2px 6px rgba(0,0,0,.06)',
                'lg': '0 12px 40px rgba(0,0,0,.12), 0 4px 12px rgba(0,0,0,.07)',
                'xl': '0 24px 64px rgba(0,0,0,.14), 0 8px 24px rgba(0,0,0,.08)',
            },
        },
    },
    plugins: [],
}
