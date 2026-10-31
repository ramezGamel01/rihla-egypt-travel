import { cityName } from "../data/cities.js";
import { BUS_CLASSES } from "../data/network.js";
import { operatorOf } from "../data/trips.js";
import { priceBreakdown } from "../lib/pricing.js";
import { useI18n } from "../i18n/I18n.jsx";

export default function Summary({ trip, seats, promo = "", children }) {
  const { t, lang, f } = useI18n();
  const price = priceBreakdown(trip.price, Math.max(seats.length, 0), promo);
  return (
    <aside className="summary card" aria-label={t("summary.title")}>
      <h2>{t("summary.title")}</h2>
      <p className="summary-route">
        <strong>{cityName(trip.from, lang)}</strong>
        <span aria-hidden="true" className="summary-arrow">
          →
        </span>
        <strong>{cityName(trip.to, lang)}</strong>
      </p>
      <p className="summary-meta">
        {f.longDay(trip.departAt)} · {f.time(trip.departAt)}
        <br />
        {operatorOf(trip).name[lang]} · {BUS_CLASSES[trip.busClass].name[lang]}
      </p>
      <div className="summary-seats">
        <span>{t("summary.seats")}</span>
        {seats.length ? (
          <ul className="seat-chips">
            {seats.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : (
          <em>{t("summary.none")}</em>
        )}
      </div>
      <dl className="summary-lines">
        <div>
          <dt>
            {t("summary.fare")} × {f.number(seats.length)}
          </dt>
          <dd>{f.money(price.subtotal)}</dd>
        </div>
        <div>
          <dt>{t("summary.fee")}</dt>
          <dd>{f.money(price.fee)}</dd>
        </div>
        {price.discount > 0 && (
          <div className="is-discount">
            <dt>{t("summary.discount")}</dt>
            <dd>−{f.money(price.discount)}</dd>
          </div>
        )}
        <div className="summary-total">
          <dt>{t("summary.total")}</dt>
          <dd key={price.total} className="bump">
            {f.money(price.total)}
          </dd>
        </div>
      </dl>
      {children}
    </aside>
  );
}
