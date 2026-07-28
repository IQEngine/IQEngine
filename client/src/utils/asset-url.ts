// Resolves a file from public/ against the base the app was built with, so
// that images still load when IQEngine is served from a sub-path rather than a
// domain root (`vite build --base=/iqengine/`). Vite rewrites asset paths it
// can see in imports and CSS, but not ones written as string literals.
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return base.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
}
