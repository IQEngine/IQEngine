/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    screens: {
      sm: '375px',
      md: '912px',
      lg: '1180px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: '#4CE091',
          secondary: '#136f63',
          accent: '#84cae7',
          neutral: '#0f172a',
          'base-100': '#05041C',
          'base-content': '#f4f4f5',
        },
      },
    ],
  },
  plugins: [require('daisyui')],
};
