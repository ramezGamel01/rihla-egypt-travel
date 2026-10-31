import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeftRight, Calendar, Minus, Plus, Search, Users } from "lucide-react";
import CityCombobox from "./CityCombobox.jsx";
import { cityName } from "../data/cities.js";
import { destinationsFrom, findRoute } from "../data/network.js";
import { todayKey } from "../data/trips.js";
import { useI18n } from "../i18n/I18n.jsx";
import { store } from "../lib/storage.js";

export const MAX_PAX = 6;

export function searchParams({ from, to, date, pax }) {
  return new URLSearchParams({ from, to, date, pax: String(pax) }).toString();
}

export default function SearchForm({ initial = {}, compact = false, onSearched }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [from, setFrom] = useState(initial.from ?? "CAI");
  const [to, setTo] = useState(initial.to ?? "LXR");
  const [date, setDate] = useState(initial.date ?? todayKey());
  const [pax, setPax] = useState(initial.pax ?? 1);
  const [error, setError] = useState("");
  const [spin, setSpin] = useState(false);

  const reachable = from ? destinationsFrom(from) : null;

  function submit(e) {
    e.preventDefault();
    if (!from || !to || from === to) return setError(t("search.same"));
    if (!findRoute(from, to)) return setError(t("search.noRoute"));
    setError("");
    const query = searchParams({ from, to, date, pax });
    store.set("rihla:lastSearch", query);
    navigate(`/trips?${query}`, { viewTransition: true });
    onSearched?.();
  }

  function swap() {
    setFrom(to);
    setTo(from);
    setSpin((s) => !s);
    setError("");
  }

  return (
    <form className={`search-form ${compact ? "is-compact" : ""}`} onSubmit={submit} aria-label={t("search.title")} noValidate>
      <div className="search-cities">
        <CityCombobox
          label={t("search.from")}
          value={from}
          onChange={(id) => {
            setFrom(id);
            setError("");
            if (to && !findRoute(id, to)) setTo("");
          }}
          invalid={Boolean(error) && !from}
        />
        <button type="button" className={`swap-btn ${spin ? "is-spun" : ""}`} onClick={swap} aria-label={t("search.swap")} title={t("search.swap")}>
          <ArrowLeftRight size={18} />
        </button>
        <CityCombobox
          label={t("search.to")}
          value={to}
          onChange={(id) => {
            setTo(id);
            setError("");
          }}
          options={reachable}
          groupLabel={from ? t("search.routes", { city: cityName(from, lang) }) : undefined}
          invalid={Boolean(error) && !to}
        />
      </div>
      <div className="field date-field">
        <label htmlFor="search-date">{t("search.date")}</label>
        <div className="field-control">
          <Calendar size={18} aria-hidden="true" className="field-icon" />
          <input id="search-date" type="date" value={date} min={todayKey()} onChange={(e) => setDate(e.target.value || todayKey())} />
        </div>
      </div>
      <div className="field pax-field">
        <span className="field-label" id="pax-label">
          {t("search.pax")}
        </span>
        <div className="field-control stepper" role="group" aria-labelledby="pax-label">
          <Users size={18} aria-hidden="true" className="field-icon" />
          <button type="button" onClick={() => setPax(Math.max(1, pax - 1))} disabled={pax <= 1} aria-label={t("search.less")}>
            <Minus size={16} />
          </button>
          <output aria-live="polite">{t("pax", { n: pax })}</output>
          <button type="button" onClick={() => setPax(Math.min(MAX_PAX, pax + 1))} disabled={pax >= MAX_PAX} aria-label={t("search.more")}>
            <Plus size={16} />
          </button>
        </div>
      </div>
      <button type="submit" className="btn btn-primary search-submit">
        <Search size={18} aria-hidden="true" />
        <span>{t("search.submit")}</span>
      </button>
      {error && (
        <p className="search-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
