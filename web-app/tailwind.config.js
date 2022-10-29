const M3ColorTypes = ['primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
  'error', 'onError', 'errorContainer', 'onErrorContainer', 'background', 'onBackground',
  'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant', 'outline', 'outlineVariant',
  'scrim', 'inverseSurface', 'inverseOnSurface', 'inversePrimary'];

const colors = M3ColorTypes.reduce((acc, curr) => {
  acc[curr] = `var(--${curr})`;
  return acc;
}, {});


/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,tsx,ts}"],
  theme: {
    colors,
  },
  plugins: [],
}
