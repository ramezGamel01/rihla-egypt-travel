// App-wide preferences and the demo account: theme, animations, signed-in user and toasts.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { store } from "../lib/storage.js";

const AppContext = createContext(null);

const systemReduce = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function AppProvider({ children }) {
  const [theme, setThemeState] = useState(() => document.documentElement.dataset.theme || "light");
  const [motion, setMotionState] = useState(() => {
    const saved = store.get("rihla:motion");
    return saved ? saved === "on" : !systemReduce();
  });
  const [user, setUser] = useState(() => store.getJSON("rihla:user", null));
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0e1a1f" : "#fff8ef");
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("no-motion", !motion);
  }, [motion]);

  const setTheme = useCallback((next) => {
    store.set("rihla:theme", next);
    const apply = () => setThemeState(next);
    if (document.startViewTransition && motion) document.startViewTransition(apply);
    else apply();
  }, [motion]);

  const setMotion = useCallback((on) => {
    store.set("rihla:motion", on ? "on" : "off");
    setMotionState(on);
  }, []);

  const toast = useCallback((text) => {
    const id = ++toastId.current;
    setToasts((list) => [...list, { id, text }]);
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 3200);
  }, []);

  const signIn = useCallback((profile) => {
    // Only the name and email are kept; the password never is
    const next = { name: profile.name, email: profile.email };
    store.setJSON("rihla:user", next);
    setUser(next);
  }, []);

  const signOut = useCallback(() => {
    store.remove("rihla:user");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, motion, setMotion, user, signIn, signOut, toasts, toast }),
    [theme, setTheme, motion, setMotion, user, signIn, signOut, toasts, toast]
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
