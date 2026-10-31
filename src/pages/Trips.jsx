import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { SlidersHorizontal, X } from "lucide-react";
import SearchForm, { MAX_PAX, searchParams } from "../components/SearchForm.jsx";
import TripCard from "../components/TripCard.jsx";
import { AmenityIcon } from "../components/Amenity.jsx";
import { CITY_BY_ID, cityName } from "../data/cities.js";
import { AMENITIES, BUS_CLASSES, OPERATORS, destinationsFrom, findRoute } from "../data/network.js";
import { addDays, cheapestFare, getTrips, todayKey } from "../data/trips.js";
import { useI18n } from "../i18n/I18n.jsx";
import { useApp } from "../state/app.jsx";

const TIMES = {
  morning: (h) => h >= 5 && h < 12,
  afternoon: (h) => h >= 12 && h < 17,
  evening: (h) => h >= 17 && h < 21,
  night: (h) => h >= 21 || h < 5,
};

const SORTS = {
  earliest: (a, b) => a.departAt.localeCompare(b.departAt),
  cheapest: (a, b) => a.price - b.price || a.departAt.localeCompare(b.departAt),
  fastest: (a, b) => a.minutes - b.minutes,
  latest: (a, b) => b.departAt.localeCompare(a.departAt),
};

const EMPTY = { maxPrice: null, times: [], classes: [], operators: [], amenities: [] };

export function filterTrips(trips, filters) {
  return trips.filter((trip) => {
    const hour = new Date(trip.departAt).getHours();
    if (filters.maxPrice != null && trip.price > filters.maxPrice) return false;
    if (filters.times.length && !filters.times.some((k) => TIMES[k](hour))) return false;
    if (filters.classes.length && !filters.classes.includes(trip.busClass)) return false;
    if (filters.operators.length && !filters.operators.includes(trip.operator)) return false;
    if (filters.amenities.length && !filters.amenities.every((a) => trip.amenities.includes(a))) return false;
    return true;
  });
}

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function DateStrip({ from, to, date, pax }) {
  const { t, f } = useI18n();
  const navigate = useNavigate();
  const today = todayKey();
  const start = date <= addDays(today, 3) ? today : addDays(date, -3);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <nav className="date-strip" aria-label={t("trips.dates")}>
      {days.map((d) => {
        const fare = cheapestFare(from, to, d);
        return (
          <button
            key={d}
            type="button"
            className={d === date ? "is-current" : ""}
            aria-current={d === date ? "date" : undefined}
            onClick={() => navigate(`/trips?${searchParams({ from, to, date: d, pax })}`, { replace: true })}
          >
            <span className="ds-day">{d === today ? t("today") : f.weekday(d)}</span>
            <span className="ds-num">{f.dayNum(d)}</span>
            {fare != null && <span className="ds-fare">{f.money(fare)}</span>}
          </button>
        );
      })}
    </nav>
  );
}

function Filters({ trips, filters, setFilters, onClose, count }) {
  const { t, lang, f } = useI18n();
  const prices = trips.map((x) => x.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const value = filters.maxPrice ?? max;
  const check = (key, id, label, extra) => (
    <label key={id} className="check">
      <input type="checkbox" checked={filters[key].includes(id)} onChange={() => setFilters({ ...filters, [key]: toggle(filters[key], id) })} />
      <span className="check-box" aria-hidden="true" />
      {extra}
      <span>{label}</span>
    </label>
  );
  return (
    <div className="filters">
      <div className="filters-head">
        <h2>{t("filters.title")}</h2>
        <button type="button" className="link-btn" onClick={() => setFilters(EMPTY)}>
          {t("filters.reset")}
        </button>
        {onClose && (
          <button type="button" className="icon-btn filters-close" onClick={onClose} aria-label={t("close")}>
            <X size={18} />
          </button>
        )}
      </div>
      {prices.length > 1 && min !== max && (
        <fieldset>
          <legend>{t("filters.price")}</legend>
          <input
            type="range"
            min={min}
            max={max}
            step={5}
            value={value}
            onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
            aria-valuetext={f.money(value)}
            style={{ "--fill": `${((value - min) / (max - min)) * 100}%` }}
          />
          <p className="range-value">
            <span>{f.money(min)}</span>
            <strong>{f.money(value)}</strong>
          </p>
        </fieldset>
      )}
      <fieldset>
        <legend>{t("filters.time")}</legend>
        <div className="check-grid">{Object.keys(TIMES).map((k) => check("times", k, t(`time.${k}`)))}</div>
      </fieldset>
      <fieldset>
        <legend>{t("filters.class")}</legend>
        {Object.values(BUS_CLASSES).map((c) => check("classes", c.id, c.name[lang]))}
      </fieldset>
      <fieldset>
        <legend>{t("filters.operator")}</legend>
        {OPERATORS.map((o) => check("operators", o.id, o.name[lang], <span className="operator-dot" style={{ "--op": o.color }} aria-hidden="true" />))}
      </fieldset>
      <fieldset>
        <legend>{t("filters.amenities")}</legend>
        {AMENITIES.map((a) => check("amenities", a, t(`amenity.${a}`), <AmenityIcon id={a} />))}
      </fieldset>
      {onClose && (
        <button type="button" className="btn btn-primary filters-apply" onClick={onClose}>
          {t("filters.show", { n: count })}
        </button>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="trip-list" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="trip-card skeleton" style={{ "--i": i }} />
      ))}
    </div>
  );
}

export default function Trips() {
  const { t, lang, f } = useI18n();
  const { motion } = useApp();
  const [params] = useSearchParams();
  const from = CITY_BY_ID[params.get("from")] ? params.get("from") : "CAI";
  const to = CITY_BY_ID[params.get("to")] ? params.get("to") : "LXR";
  const rawDate = params.get("date");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate ?? "") && rawDate >= todayKey() ? rawDate : todayKey();
  const pax = Math.min(MAX_PAX, Math.max(1, Number(params.get("pax")) || 1));

  const [filters, setFilters] = useState(EMPTY);
  const [sort, setSort] = useState("earliest");
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);

  const route = findRoute(from, to);
  const [now] = useState(() => Date.now());
  // Departures that have already left today are hidden
  const trips = useMemo(() => getTrips(from, to, date).filter((x) => new Date(x.departAt).getTime() > now), [from, to, date, now]);
  const shown = useMemo(() => filterTrips(trips, filters).sort(SORTS[sort]), [trips, filters, sort]);

  useEffect(() => {
    document.title = `${t("trips.title", { from: cityName(from, lang), to: cityName(to, lang) })} · Rihla`;
  }, [from, to, lang, t]);

  // A short pause so a new search reads as a search
  useEffect(() => {
    setLoading(true);
    setFilters(EMPTY);
    const timer = setTimeout(() => setLoading(false), motion ? 380 : 0);
    return () => clearTimeout(timer);
  }, [from, to, date, motion]);

  useEffect(() => {
    document.documentElement.classList.toggle("drawer-open", drawer);
    return () => document.documentElement.classList.remove("drawer-open");
  }, [drawer]);

  return (
    <div className="page-trips">
      <section className="search-band">
        <div className="container">
          <SearchForm key={`${from}${to}${date}${pax}`} initial={{ from, to, date, pax }} compact />
        </div>
      </section>
      <div className="container trips-layout">
        <header className="trips-head">
          <h1>{t("trips.title", { from: cityName(from, lang), to: cityName(to, lang) })}</h1>
          <p>
            {f.longDay(date)} · {t("pax", { n: pax })}
          </p>
        </header>

        {!route ? (
          <div className="empty card">
            <h2>{t("trips.noRoute")}</h2>
            <p>{t("trips.noRouteHint", { city: cityName(from, lang) })}</p>
            <ul className="route-chips">
              {destinationsFrom(from).map((id) => (
                <li key={id}>
                  <Link to={`/trips?${searchParams({ from, to: id, date, pax })}`}>{cityName(id, lang)}</Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <DateStrip from={from} to={to} date={date} pax={pax} />
            <div className="trips-grid">
              <aside className={`filters-panel ${drawer ? "is-open" : ""}`}>
                {trips.length > 0 && (
                  <Filters trips={trips} filters={filters} setFilters={setFilters} onClose={drawer ? () => setDrawer(false) : null} count={shown.length} />
                )}
              </aside>
              {drawer && <div className="drawer-scrim" onClick={() => setDrawer(false)} aria-hidden="true" />}
              <section className="results" aria-busy={loading} aria-label={t("trips.count", { n: shown.length })}>
                <div className="results-bar">
                  <p className="results-count" aria-live="polite">
                    {loading ? t("trips.loading") : t("trips.count", { n: shown.length })}
                  </p>
                  <button type="button" className="chip-btn filters-toggle" onClick={() => setDrawer(true)}>
                    <SlidersHorizontal size={16} /> {t("filters.open")}
                  </button>
                  <div className="sort" role="radiogroup" aria-label={t("sort.label")}>
                    {Object.keys(SORTS).map((k) => (
                      <button key={k} type="button" role="radio" aria-checked={sort === k} className={sort === k ? "is-on" : ""} onClick={() => setSort(k)}>
                        {t(`sort.${k}`)}
                      </button>
                    ))}
                  </div>
                </div>
                {loading ? (
                  <Skeleton />
                ) : shown.length ? (
                  <div className="trip-list">
                    {shown.map((trip, i) => (
                      <TripCard key={trip.id} trip={trip} pax={pax} index={i} />
                    ))}
                  </div>
                ) : (
                  <div className="empty card">
                    <h2>{t("trips.none")}</h2>
                    <p>{t("trips.noneHint")}</p>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
