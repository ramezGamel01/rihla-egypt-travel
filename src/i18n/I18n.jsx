import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { STRINGS } from "./strings.js";
import { store } from "../lib/storage.js";

const I18nContext = createContext(null);

export function makeTranslator(lang) {
  const plural = new Intl.PluralRules(lang === "ar" ? "ar" : "en");
  const digits = new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-GB");
  const dict = STRINGS[lang];
  return function t(key, vars = {}) {
    let entry = dict[key] ?? STRINGS.en[key] ?? key;
    if (typeof entry === "object") {
      const n = Number(vars.n ?? 0);
      entry = entry[plural.select(n)] ?? entry.other;
    }
    // Numbers come out in the page's own digits (Arabic-Indic in Arabic)
    return entry.replace(/\{(\w+)\}/g, (_, name) => {
      const v = vars[name];
      if (v === undefined) return `{${name}}`;
      return typeof v === "number" ? digits.format(v) : String(v);
    });
  };
}

export function makeFormat(lang) {
  const locale = lang === "ar" ? "ar-EG" : "en-GB";
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "EGP", maximumFractionDigits: 0 });
  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: lang === "ar" });
  const day = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" });
  const longDay = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const dayNum = new Intl.DateTimeFormat(locale, { day: "numeric" });
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const toDate = (value) => (typeof value === "string" && value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value));
  const t = makeTranslator(lang);
  return {
    money: (v) => money.format(v),
    number: (v) => number.format(v),
    percent: (v) => percent.format(v),
    time: (v) => time.format(toDate(v)),
    day: (v) => day.format(toDate(v)),
    longDay: (v) => longDay.format(toDate(v)),
    dayNum: (v) => dayNum.format(toDate(v)),
    weekday: (v) => weekday.format(toDate(v)),
    duration(minutes) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m ? t("trip.hours", { h: number.format(h), m: number.format(m) }) : t("trip.hoursOnly", { h: number.format(h) });
    },
  };
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => (store.get("rihla:lang") === "ar" ? "ar" : "en"));

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((next) => {
    store.set("rihla:lang", next);
    const apply = () => setLangState(next);
    // Cross-fade the whole page when the browser supports view transitions
    if (document.startViewTransition && !document.documentElement.classList.contains("no-motion")) {
      document.startViewTransition(apply);
    } else apply();
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, t: makeTranslator(lang), f: makeFormat(lang), dir: lang === "ar" ? "rtl" : "ltr" }),
    [lang, setLang]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
