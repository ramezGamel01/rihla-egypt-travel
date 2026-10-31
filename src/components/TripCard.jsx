import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import AmenityList from "./Amenity.jsx";
import { cityName } from "../data/cities.js";
import { BUS_CLASSES } from "../data/network.js";
import { operatorOf, seatsLeft } from "../data/trips.js";
import { useI18n } from "../i18n/I18n.jsx";

export function TripTimes({ trip }) {
  const { lang, f, t } = useI18n();
  const nextDay = new Date(trip.arriveAt).getDate() !== new Date(trip.departAt).getDate();
  return (
    <div className="trip-times">
      <div className="trip-stop">
        <time dateTime={trip.departAt}>{f.time(trip.departAt)}</time>
        <span>{cityName(trip.from, lang)}</span>
      </div>
      <div className="trip-line" aria-hidden="true">
        <span className="trip-duration">{f.duration(trip.minutes)}</span>
        <span className="trip-track">
          <span className="trip-bus" />
        </span>
        <span className="trip-direct">{t("trip.direct")}</span>
      </div>
      <div className="trip-stop is-end">
        <time dateTime={trip.arriveAt}>
          {f.time(trip.arriveAt)}
          {nextDay && <sup>{t("trip.nextDay")}</sup>}
        </time>
        <span>{cityName(trip.to, lang)}</span>
      </div>
    </div>
  );
}

export default function TripCard({ trip, pax, index = 0 }) {
  const { t, lang, f } = useI18n();
  const operator = operatorOf(trip);
  const left = seatsLeft(trip);
  const low = left <= 8;
  return (
    <article className="trip-card" style={{ "--i": index, "--op": operator.color }}>
      <div className="trip-card-main">
        <div className="trip-card-head">
          <span className="operator">
            <span className="operator-dot" aria-hidden="true" />
            {operator.name[lang]}
          </span>
          <span className={`class-badge is-${trip.busClass}`}>{BUS_CLASSES[trip.busClass].name[lang]}</span>
        </div>
        <TripTimes trip={trip} />
        <div className="trip-card-foot">
          <AmenityList ids={trip.amenities} />
          <span className={`seats-left ${low ? "is-low" : ""}`}>{t("trip.seatsLeft", { n: left })}</span>
        </div>
      </div>
      <div className="trip-card-price">
        <p className="price">
          <strong>{f.money(trip.price)}</strong>
          <span>{t("trip.perSeat")}</span>
        </p>
        <Link className="btn btn-primary" to={`/trip/${trip.id}?pax=${pax}`} viewTransition>
          {t("trip.select")}
          <ArrowRight size={17} className="flip-rtl" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
