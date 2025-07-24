// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {}, // This is the new way to include Tailwind CSS as a PostCSS plugin
    'autoprefixer': {}, // Autoprefixer is often still useful for vendor prefixes
    // You might no longer need 'postcss-import' with Tailwind CSS v4,
    // as it handles @import internally for its own directives.
  },
};