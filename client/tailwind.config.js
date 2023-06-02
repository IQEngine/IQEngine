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
        'iqengine-neutral': '#FAFAFA',
      },
    },
  },
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: '#4CE091',
          secondary: '#136f63',
          accent: '#84cae7',
          neutral: '#FAFAFA',
          'base-100': '#05041C',
          info: '#386BE0',
          success: '#149964',
          warning: '#A07E0D',
          error: '#F9666B',
        },
      },
    ],
  },
  plugins: [require('daisyui')],
};
