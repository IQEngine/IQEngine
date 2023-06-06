/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
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
