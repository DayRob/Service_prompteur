export type Theme = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
export const THEME_EVENT = "forge-theme-change";

/** Script exécuté avant le premier rendu pour éviter l'éclair de mauvais thème. Garder aligné avec applyTheme. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||((t===null||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export function readTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(theme: Theme): void {
  const dark =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function storeTheme(theme: Theme): void {
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* stockage indisponible : le thème reste valable pour la page en cours */
  }
  applyTheme(theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}
