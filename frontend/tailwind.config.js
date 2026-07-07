/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary, #6366f1)',
          dark: 'var(--primary-hover, #4f46e5)',
        },
        secondary: 'var(--secondary, #8b5cf6)',
        accent: 'var(--accent, #ec4899)',
        success: 'var(--success, #10b981)',
        warning: 'var(--warning, #f59e0b)',
        danger: 'var(--danger, #ef4444)',
        background: 'var(--background, #f9fafb)',
        card: 'var(--card-bg, #ffffff)',
      },
      borderRadius: {
        'xl': 'var(--radius-xl, 12px)',
        '2xl': 'var(--radius-2xl, 16px)',
      }
    },
  },
  plugins: [],
}
