/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'iqengine-primary': '#4CE091', // emerald
        'iqengine-secondary': '#136f63', // pine green (darkish green)
        'iqengine-tertiary': '#84cae7', // sky blue
        'iqengine-bg': '#05041C', // very dark blue
      },
    },
  },
  plugins: [],
};
