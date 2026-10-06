"use client";

import { useEffect, useSyncExternalStore } from "react";
import { applyTheme, readTheme, storeTheme, THEME_EVENT, type Theme } from "@/lib/theme";

const ORDER: Theme[] = ["system", "light", "dark"];
const LABEL: Record<Theme, string> = { system: "système", light: "clair", dark: "sombre" };

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);

  // En mode système, suivre les changements de préférence de l'appareil.
  useEffect(() => {
    if (theme !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [theme]);

  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => storeTheme(next)}
      className="btn-ghost min-w-11 px-3 text-sm"
      aria-label={`Thème ${LABEL[theme]}. Passer au thème ${LABEL[next]}`}
      title={`Thème : ${LABEL[theme]}`}
    >
      <span aria-hidden="true">{theme === "dark" ? "☾" : theme === "light" ? "☀" : "◐"}</span>
    </button>
  );
}
