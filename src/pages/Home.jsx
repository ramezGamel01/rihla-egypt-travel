import { lazy, Suspense, useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Armchair, Search, Ticket } from "lucide-react";
import SearchForm, { searchParams } from "../components/SearchForm.jsx";
import { Reveal, useScrollProgress, useTilt } from "../components/motion.jsx";
import { CITIES, CITY_BY_ID, cityName } from "../data/cities.js";
import { ROUTES, findRoute } from "../data/network.js";
import { cheapestFare, getTrips, todayKey, addDays } from "../data/trips.js";
import { useI18n } from "../i18n/I18n.jsx";
import { useApp } from "../state/app.jsx";
import { SceneBoundary, useOnScreen } from "../three/SceneGuard.jsx";
import { JOURNEY_STOPS } from "../data/journey.js";

const HeroScene = lazy(() => import("../three/HeroScene.jsx"));
const JourneyScene = lazy(() => import("../three/JourneyScene.jsx"));

const img = (name) => `${import.meta.env.BASE_URL}images/${name}.webp`;

const POPULAR = [
  ["CAI", "ALX"],
  ["CAI", "LXR"],
  ["CAI", "HRG"],
  ["CAI", "SSH"],
  ["LXR", "ASW"],
  ["ALX", "SIW"],
];

function Hero() {
  const { t, f, dir } = useI18n();
  const { theme, motion } = useApp();
  const ref = useRef(null);
  const progress = useRef(0);
  const visible = useOnScreen(ref, "0px");
  useScrollProgress(
    ref,
    useCallback((p) => (progress.current = p), [])
  );
  const tomorrow = addDays(todayKey(), 1);
  const daily = useMemo(() => ROUTES.reduce((sum, r) => sum + getTrips(r.from, r.to, tomorrow).length, 0), [tomorrow]);

  return (
    <section className="hero" ref={ref}>
      <div className="hero-scene">
        <div className="hero-sky" aria-hidden="true" />
        <SceneBoundary fallback={null}>
          <Suspense fallback={null}>
            <HeroScene key={dir} night={theme === "dark"} motion={motion} active={visible} progress={progress} label={t("home.sceneLabel")} rtl={dir === "rtl"} />
          </Suspense>
        </SceneBoundary>
        <div className="hero-fade" aria-hidden="true" />
      </div>
      <div className="container hero-content">
        <p className="eyebrow hero-in" style={{ "--d": 0 }}>
          {t("home.eyebrow")}
        </p>
        <h1 className="hero-title">
          <span className="hero-in" style={{ "--d": 1 }}>
            {t("home.title1")}
          </span>
          <span className="hero-in accent" style={{ "--d": 2 }}>
            {t("home.title2")}
          </span>
        </h1>
        <p className="hero-lead hero-in" style={{ "--d": 3 }}>
          {t("home.lead")}
        </p>
        <div className="hero-search hero-in" style={{ "--d": 4 }}>
          <SearchForm initial={{ date: tomorrow }} />
        </div>
        <ul className="hero-stats hero-in" style={{ "--d": 5 }}>
          <li>
            <strong>{f.number(ROUTES.length / 2)}</strong> {t("home.stat.routes")}
          </li>
          <li>
            <strong>{f.number(CITIES.length)}</strong> {t("home.stat.cities")}
          </li>
          <li>
            <strong>{f.number(daily)}</strong> {t("home.stat.daily")}
          </li>
        </ul>
      </div>
    </section>
  );
}

function Popular() {
  const { t, lang, f } = useI18n();
  const date = addDays(todayKey(), 1);
  return (
    <section className="section popular" aria-labelledby="popular-title">
      <div className="container">
        <Reveal as="h2" className="section-title" id="popular-title">
          {t("popular.title")}
        </Reveal>
        <ul className="popular-list">
          {POPULAR.map(([from, to], i) => {
            const route = findRoute(from, to);
            return (
              <Reveal as="li" key={`${from}${to}`} delay={i * 60}>
                <Link className="popular-card" to={`/trips?${searchParams({ from, to, date, pax: 1 })}`} viewTransition>
                  <span className="popular-cities">
                    {cityName(from, lang)}
                    <ArrowRight size={16} className="flip-rtl" aria-hidden="true" />
                    {cityName(to, lang)}
                  </span>
                  <span className="popular-meta">
                    {f.duration(route.minutes)} · {t("popular.from", { price: f.money(cheapestFare(from, to, date)) })}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function DestinationCard({ city, index }) {
  const { t, lang, f } = useI18n();
  const ref = useTilt(9);
  // Cairo itself is reached from Alexandria; everywhere else from Cairo
  const origin = city.id === "CAI" ? "ALX" : "CAI";
  const route = findRoute(origin, city.id);
  const date = addDays(todayKey(), 1);
  return (
    <Reveal as="li" delay={index * 70} className="dest-item">
      <Link ref={ref} to={`/trips?${searchParams({ from: origin, to: city.id, date, pax: 1 })}`} className="dest-card" viewTransition>
        <span className="dest-media">
          <img src={img(city.image)} alt="" loading="lazy" width="413" height="220" />
        </span>
        <span className="dest-glare" aria-hidden="true" />
        <span className="dest-body">
          <span className="dest-region">{city.region[lang]}</span>
          <span className="dest-name">{city.name[lang]}</span>
          <span className="dest-blurb">{city.blurb[lang]}</span>
          {route && <span className="dest-meta">{t("dest.from", { time: f.duration(route.minutes), city: cityName(origin, lang) })}</span>}
          <span className="dest-cta">
            {t("dest.cta")} <ArrowRight size={16} className="flip-rtl" aria-hidden="true" />
          </span>
        </span>
      </Link>
    </Reveal>
  );
}

function Destinations() {
  const { t } = useI18n();
  const cities = CITIES.filter((c) => c.image && c.id !== "CAI");
  return (
    <section className="section destinations" aria-labelledby="dest-title">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">{t("dest.eyebrow")}</p>
          <h2 className="section-title" id="dest-title">
            {t("dest.title")}
          </h2>
          <p className="section-lead">{t("dest.lead")}</p>
        </Reveal>
        <ul className="dest-grid">
          {[CITY_BY_ID.CAI, ...cities].map((city, i) => (
            <DestinationCard key={city.id} city={city} index={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}

const LEGS = [
  ["CAI", "ALX"],
  ["ALX", "CAI"],
  ["CAI", "LXR"],
  ["LXR", "ASW"],
  ["ASW", "HRG"],
];

function Journey() {
  const { t, lang, f } = useI18n();
  const { theme, motion } = useApp();
  const ref = useRef(null);
  const progress = useRef(0);
  const visible = useOnScreen(ref, "200px");
  const stops = JOURNEY_STOPS;
  const [active, setActive] = useState(stops[0]);
  useScrollProgress(
    ref,
    useCallback((p) => (progress.current = p), [])
  );
  const index = stops.indexOf(active);
  const date = addDays(todayKey(), 1);

  const chapters = stops.map((id, i) => {
    const [from, to] = LEGS[i];
    const route = findRoute(from, to);
    return (
      <article key={id} className={`chapter ${i === index ? "is-active" : ""}`} aria-hidden={motion ? i !== index : undefined}>
        <p className="chapter-num">
          {f.number(i + 1)} / {f.number(stops.length)}
        </p>
        <h3>{cityName(id, lang)}</h3>
        <p>{t(`journey.${i + 1}`)}</p>
        <p className="chapter-leg">
          {t("journey.leg", { from: cityName(from, lang), to: cityName(to, lang), time: f.duration(route.minutes), price: f.money(cheapestFare(from, to, date)) })}
        </p>
        {i === stops.length - 1 && (
          <Link className="btn btn-primary" to={`/trips?${searchParams({ from: "CAI", to: "ALX", date, pax: 1 })}`} viewTransition>
            {t("journey.cta")}
          </Link>
        )}
      </article>
    );
  });

  return (
    <section className={`journey ${motion ? "is-scroll" : "is-static"}`} ref={ref} aria-labelledby="journey-title">
      <div className="journey-sticky">
        <div className="journey-map">
          <SceneBoundary fallback={<div className="journey-fallback" />}>
            <Suspense fallback={<div className="journey-fallback" />}>
              <JourneyScene
                progress={progress}
                dark={theme === "dark"}
                onStop={setActive}
                active={active}
                lang={lang}
                motion={motion}
                running={visible}
                label={t("journey.mapLabel")}
              />
            </Suspense>
          </SceneBoundary>
        </div>
        <div className="container journey-overlay">
          <header className="journey-head">
            <p className="eyebrow">{t("journey.eyebrow")}</p>
            <h2 className="section-title" id="journey-title">
              {t("journey.title")}
            </h2>
            <p className="section-lead">{t("journey.lead")}</p>
          </header>
          <div className="chapters">{chapters}</div>
          <ol className="journey-dots" aria-hidden="true">
            {stops.map((id, i) => (
              <li key={id} className={i <= index ? "is-done" : ""} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function How() {
  const { t } = useI18n();
  const steps = [
    { icon: Search, key: 1 },
    { icon: Armchair, key: 2 },
    { icon: Ticket, key: 3 },
  ];
  return (
    <section className="section how" aria-labelledby="how-title">
      <div className="container">
        <Reveal as="h2" className="section-title" id="how-title">
          {t("how.title")}
        </Reveal>
        <ol className="how-steps">
          {steps.map(({ icon: Icon, key }, i) => (
            <Reveal as="li" key={key} delay={i * 90} className="how-step">
              <span className="how-icon" aria-hidden="true">
                <Icon size={24} />
              </span>
              <h3>{t(`how.${key}.t`)}</h3>
              <p>{t(`how.${key}.d`)}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="page-home">
      <Hero />
      <Popular />
      <Destinations />
      <Journey />
      <How />
    </div>
  );
}
