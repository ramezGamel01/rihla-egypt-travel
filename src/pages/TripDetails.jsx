import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Box, LayoutGrid, Rotate3d } from "lucide-react";
import SeatMap from "../components/SeatMap.jsx";
import Summary from "../components/Summary.jsx";
import AmenityList from "../components/Amenity.jsx";
import { TripTimes } from "../components/TripCard.jsx";
import { MAX_PAX, searchParams } from "../components/SearchForm.jsx";
import { cityName } from "../data/cities.js";
import { BUS_CLASSES } from "../data/network.js";
import { getTrip, operatorOf, takenSeats } from "../data/trips.js";
import { toggleSeat } from "../lib/pricing.js";
import { seatsBookedOn } from "../state/bookings.js";
import { useI18n } from "../i18n/I18n.jsx";
import { useApp } from "../state/app.jsx";
import { SceneBoundary } from "../three/SceneGuard.jsx";

const BusSeats3D = lazy(() => import("../three/BusSeats3D.jsx"));

export default function TripDetails() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { t, lang, f } = useI18n();
  const { theme, motion } = useApp();
  const navigate = useNavigate();
  const pax = Math.min(MAX_PAX, Math.max(1, Number(params.get("pax")) || 1));
  const trip = useMemo(() => getTrip(id), [id]);
  const [view, setView] = useState("2d");
  const [picked, setPicked] = useState(() => (params.get("seats") ? params.get("seats").split(",") : []));
  const [notice, setNotice] = useState("");

  const taken = useMemo(() => (trip ? new Set([...takenSeats(trip), ...seatsBookedOn(trip.id)]) : new Set()), [trip]);

  useEffect(() => {
    if (trip) document.title = `${cityName(trip.from, lang)} → ${cityName(trip.to, lang)} · Rihla`;
  }, [trip, lang]);

  if (!trip) {
    return (
      <div className="container page-narrow">
        <div className="empty card">
          <h1>{t("details.notFound")}</h1>
          <Link className="btn btn-primary" to="/">
            {t("notFound.home")}
          </Link>
        </div>
      </div>
    );
  }

  const departed = new Date(trip.departAt) < new Date();
  const operator = operatorOf(trip);
  const back = `/trips?${searchParams({ from: trip.from, to: trip.to, date: trip.date, pax })}`;
  const missing = pax - picked.length;

  function onToggle(label) {
    const next = toggleSeat(picked, label, pax, taken);
    setNotice(next === picked && !picked.includes(label) ? t("seats.full", { n: pax }) : "");
    setPicked(next);
  }

  return (
    <div className="page-trip container">
      <Link className="back-link" to={back} viewTransition>
        <ArrowLeft size={17} className="flip-rtl" aria-hidden="true" />
        {t("details.back")}
      </Link>
      <div className="trip-layout">
        <div className="trip-main">
          <header className="card trip-hero" style={{ "--op": operator.color }}>
            <p className="eyebrow">{f.longDay(trip.departAt)}</p>
            <h1>
              {cityName(trip.from, lang)} <span aria-hidden="true">→</span> {cityName(trip.to, lang)}
            </h1>
            <TripTimes trip={trip} />
            <dl className="trip-facts">
              <div>
                <dt>{t("details.operator")}</dt>
                <dd>
                  <span className="operator-dot" aria-hidden="true" /> {operator.name[lang]}
                </dd>
              </div>
              <div>
                <dt>{t("details.bus")}</dt>
                <dd>{BUS_CLASSES[trip.busClass].name[lang]}</dd>
              </div>
              <div className="trip-facts-wide">
                <dt>{t("details.amenities")}</dt>
                <dd>
                  <AmenityList ids={trip.amenities} labels />
                </dd>
              </div>
            </dl>
          </header>

          <section className="card seats-card" aria-labelledby="seats-title">
            <div className="seats-head">
              <div>
                <h2 id="seats-title">{t("seats.title")}</h2>
                <p>{t("seats.hint", { n: pax })}</p>
              </div>
              <div className="segmented" role="radiogroup" aria-label={t("seats.views")}>
                <button type="button" role="radio" aria-checked={view === "2d"} onClick={() => setView("2d")}>
                  <LayoutGrid size={16} aria-hidden="true" /> {t("seats.view2d")}
                </button>
                <button type="button" role="radio" aria-checked={view === "3d"} onClick={() => setView("3d")}>
                  <Box size={16} aria-hidden="true" /> {t("seats.view3d")}
                </button>
              </div>
            </div>
            {departed ? (
              <p className="notice">{t("details.departed")}</p>
            ) : view === "2d" ? (
              <SeatMap busClass={trip.busClass} taken={taken} picked={picked} onToggle={onToggle} />
            ) : (
              <div className="seats-3d">
                <SceneBoundary fallback={<SeatMap busClass={trip.busClass} taken={taken} picked={picked} onToggle={onToggle} />}>
                  <Suspense fallback={<div className="scene-loading">{t("seats.3dLoading")}</div>}>
                    <BusSeats3D
                      busClass={trip.busClass}
                      taken={taken}
                      picked={picked}
                      onToggle={onToggle}
                      dark={theme === "dark"}
                      motion={motion}
                      label={t("seats.mapLabel")}
                    />
                  </Suspense>
                </SceneBoundary>
                <p className="seats-3d-hint">
                  <Rotate3d size={16} aria-hidden="true" /> {t("seats.3dHint")}
                </p>
              </div>
            )}
            <p className="seat-notice" role="status">
              {notice}
            </p>
          </section>
        </div>

        <Summary trip={trip} seats={picked}>
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={missing > 0 || departed}
            onClick={() => navigate(`/checkout/${trip.id}?${new URLSearchParams({ seats: picked.join(","), pax: String(pax) })}`, { viewTransition: true })}
          >
            {missing > 0 ? t("summary.more", { n: missing }) : t("summary.continue")}
          </button>
        </Summary>
      </div>
    </div>
  );
}
