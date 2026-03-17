import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: { colors: {
    dark: { 900: '#0a0a14', 800: '#0f0f1a', 700: '#1a1a2e', 600: '#252538', 500: '#2a2a3e', 400: '#3a3a50' },
  }}},
  plugins: [],
};
export default config;
