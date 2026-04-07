const themeInitScript = `
(() => {
  const storageKey = "glossary-os-theme";
  const root = document.documentElement;
  const stored = window.localStorage.getItem(storageKey);
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = stored === "light" || stored === "dark" ? stored : (systemDark ? "dark" : "light");
  root.dataset.theme = theme;
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />;
}
