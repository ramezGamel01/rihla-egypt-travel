import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Bus, Ticket } from "lucide-react";
import Dialog from "../components/Dialog.jsx";
import { Reveal } from "../components/motion.jsx";
import { cityName } from "../data/cities.js";
import { OPERATOR_BY_ID } from "../data/network.js";
import { bookingState, cancelBooking, useBookings } from "../state/bookings.js";
import { useI18n } from "../i18n/I18n.jsx";
import { useApp } from "../state/app.jsx";

const TABS = ["upcoming", "past", "cancelled"];

export default function Bookings() {
  const { t, lang, f } = useI18n();
  const { toast } = useApp();
  const bookings = useBookings();
  const [tab, setTab] = useState("upcoming");
  const [confirm, setConfirm] = useState(null);
  const tabRefs = useRef({});

  useEffect(() => {
    document.title = `${t("bookings.title")} · Rihla`;
  }, [t]);

  const groups = Object.fromEntries(TABS.map((k) => [k, []]));
  bookings.forEach((b) => groups[bookingState(b)].push(b));
  groups.upcoming.sort((a, b) => a.departAt.localeCompare(b.departAt));
  groups.past.sort((a, b) => b.departAt.localeCompare(a.departAt));
  const list = groups[tab];

  function onTabKey(e) {
    const i = TABS.indexOf(tab);
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    const dir = document.documentElement.dir === "rtl" ? -step : step;
    const next = TABS[(i + dir + TABS.length) % TABS.length];
    setTab(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="page-bookings container">
      <header className="page-head">
        <h1>{t("bookings.title")}</h1>
        <p className="muted">{t("bookings.local")}</p>
      </header>
      <div className="tabs" role="tablist" aria-label={t("bookings.tabs")} onKeyDown={onTabKey}>
        {TABS.map((k) => (
          <button
            key={k}
            ref={(el) => (tabRefs.current[k] = el)}
            id={`tab-${k}`}
            type="button"
            role="tab"
            aria-selected={tab === k}
            aria-controls="booking-panel"
            tabIndex={tab === k ? 0 : -1}
            onClick={() => setTab(k)}
          >
            {t(`bookings.${k}`)}
            <span className="tab-count">{f.number(groups[k].length)}</span>
          </button>
        ))}
      </div>
      <section id="booking-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="booking-panel">
        {list.length === 0 ? (
          <div className="empty card empty-art">
            <div className="empty-road" aria-hidden="true">
              <Bus size={30} />
            </div>
            <h2>{t("bookings.empty")}</h2>
            <Link className="btn btn-primary" to="/" viewTransition>
              {t("bookings.find")}
            </Link>
          </div>
        ) : (
          <ul className="booking-list">
            {list.map((b, i) => (
              <Reveal as="li" key={b.ref} delay={i * 60} className={`booking card is-${bookingState(b)}`}>
                <div className="booking-main">
                  <p className="booking-route">
                    {cityName(b.from, lang)} <ArrowRight size={16} className="flip-rtl" aria-hidden="true" /> {cityName(b.to, lang)}
                  </p>
                  <p className="booking-when">
                    {f.longDay(b.departAt)} · {f.time(b.departAt)}
                  </p>
                  <p className="booking-meta">
                    {OPERATOR_BY_ID[b.operator].name[lang]} · {b.seats.join(", ")} · <span className="mono">{b.ref}</span>
                  </p>
                </div>
                <div className="booking-actions">
                  <strong>{f.money(b.price.total)}</strong>
                  <Link className="btn btn-ghost btn-small" to={`/ticket/${b.ref}`} viewTransition>
                    <Ticket size={16} aria-hidden="true" /> {t("bookings.view")}
                  </Link>
                  {bookingState(b) === "upcoming" && (
                    <button type="button" className="link-btn danger" onClick={() => setConfirm(b)}>
                      {t("bookings.cancel")}
                    </button>
                  )}
                </div>
              </Reveal>
            ))}
          </ul>
        )}
      </section>
      <Dialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={t("bookings.cancelTitle")}
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirm(null)}>
              {t("bookings.keep")}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                cancelBooking(confirm.ref);
                setConfirm(null);
                toast(t("toast.cancelled"));
              }}
            >
              {t("bookings.cancel")}
            </button>
          </>
        }
      >
        <p>{t("bookings.cancelText")}</p>
      </Dialog>
    </div>
  );
}
