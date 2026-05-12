/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        "2xl": "var(--radius-lg)",
        xl: "var(--radius-md)",
        lg: "var(--radius)",
        md: "var(--radius-sm)",
        sm: "calc(var(--radius-sm) - 2px)",
        full: "var(--radius-full)",
      },
      spacing: {
        'unit': 'var(--space-unit)',
        'gap': 'var(--space-gap)',
        'gutter': 'var(--space-gutter)',
        'inner': 'var(--space-inner)',
        'container-margin': 'var(--space-container)',
      },
      boxShadow: {
        'neu-extruded': '-8px -8px 16px var(--shadow-light), 8px 8px 16px var(--shadow-dark)',
        'neu-inset': 'inset 6px 6px 12px var(--shadow-dark), inset -6px -6px 12px var(--shadow-light)',
        'neu-subtle': '-4px -4px 8px var(--shadow-light), 4px 4px 8px rgba(209, 217, 230, 0.6)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}