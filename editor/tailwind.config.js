import theme from 'tailwindcss/defaultTheme';

module.exports = {
  darkMode: 'class', // or 'media' or 'class'
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary': '#3D95CE',
        'secondary': '#CE763D',
        'tertiary': '#95CE3D',
        'warn': '#D4AA00',
        'background': 'rgb(33, 36, 38)'
      },
      fontFamily: {
        'montserrat': ['Montserrat'],
        'sans': ['Roboto', ...theme.fontFamily.sans],
      },
      height: {
        '50vh': '50vh',
        'sidebar': 'calc(50vh - 2rem)'
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
