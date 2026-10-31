import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { CalendarPlus, Printer, RotateCcw, Ticket as TicketIcon } from "lucide-react";
import QRCode from "qrcode";
import Logo from "../components/Logo.jsx";
import { useTilt } from "../components/motion.jsx";
import { cityName } from "../data/cities.js";
import { BUS_CLASSES, OPERATOR_BY_ID } from "../data/network.js";
import { bookingToIcs, downloadFile } from "../lib/ics.js";
import { useBookings } from "../state/bookings.js";
import { useI18n } from "../i18n/I18n.jsx";
import { useApp } from "../state/app.jsx";

function Confetti() {
  const colors = ["#e76f51", "#f4a261", "#e9c46a", "#2a9d8f", "#264653"];
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
        <i key={i} style={{ "--x": `${(i * 37) % 100}%`, "--c": colors[i % colors.length], "--d": `${(i % 9) * 0.07}s`, "--r": `${(i * 47) % 360}deg` }} />
      ))}
    </div>
  );
}

export default function Ticket() {
  const { ref } = useParams();
  const location = useLocation();
  const { t, lang, f } = useI18n();
  const { motion } = useApp();
  const bookings = useBookings();
  const booking = bookings.find((b) => b.ref === ref);
  const [qr, setQr] = useState("");
  const [flipped, setFlipped] = useState(false);
  const tilt = useTilt(6);
  const fresh = Boolean(location.state?.fresh);

  useEffect(() => {
    if (!booking) return;
    document.title = `${booking.ref} · Rihla`;
    QRCode.toString(`RIHLA|${booking.ref}|${booking.tripId}|${booking.seats.join(",")}`, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#14272e", light: "#00000000" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [booking]);

  if (!booking) {
    return (
      <div className="container page-narrow">
        <div className="empty card">
          <h1>{t("ticket.notFound")}</h1>
          <Link className="btn btn-primary" to="/bookings">
            {t("nav.bookings")}
          </Link>
        </div>
      </div>
    );
  }

  const operator = OPERATOR_BY_ID[booking.operator];
  const cancelled = booking.status === "cancelled";

  function addToCalendar() {
    const ics = bookingToIcs({
      ref: booking.ref,
      departAt: booking.departAt,
      arriveAt: booking.arriveAt,
      title: `${cityName(booking.from, "en")} → ${cityName(booking.to, "en")} (Rihla ${booking.ref})`,
      location: `${operator.name.en} bus station, ${cityName(booking.from, "en")}`,
      description: `Seats ${booking.seats.join(", ")}. Booking ${booking.ref}.`,
    });
    downloadFile(`rihla-${booking.ref}.ics`, ics, "text/calendar");
  }

  return (
    <div className="page-ticket container">
      {fresh && motion && <Confetti />}
      <header className="ticket-head">
        <h1>{fresh ? t("ticket.title", { city: cityName(booking.to, lang) }) : `${cityName(booking.from, lang)} → ${cityName(booking.to, lang)}`}</h1>
        <p>{t("ticket.sub")}</p>
      </header>

      <div className={`ticket-stage ${fresh && motion ? "is-arriving" : ""}`}>
        <div ref={tilt} className="ticket-tilt">
          <div className={`ticket ${flipped ? "is-flipped" : ""} ${cancelled ? "is-cancelled" : ""}`}>
            <section className="ticket-face ticket-front" aria-hidden={flipped}>
              <div className="ticket-top">
                <span className="ticket-brand">
                  <Logo size={28} /> Rihla
                </span>
                <span className="ticket-ref">
                  <small>{t("ticket.ref")}</small>
                  {booking.ref}
                </span>
              </div>
              <div className="ticket-route">
                <div>
                  <small>{t("ticket.depart")}</small>
                  <strong>{cityName(booking.from, lang)}</strong>
                  <span>{f.time(booking.departAt)}</span>
                </div>
                <span className="ticket-bus" aria-hidden="true">
                  <TicketIcon size={20} />
                </span>
                <div className="is-end">
                  <small>{t("ticket.arrive")}</small>
                  <strong>{cityName(booking.to, lang)}</strong>
                  <span>{f.time(booking.arriveAt)}</span>
                </div>
              </div>
              <p className="ticket-date">{f.longDay(booking.departAt)}</p>
              <dl className="ticket-grid">
                <div>
                  <dt>{t("ticket.passengers")}</dt>
                  <dd>
                    {booking.passengers.map((p) => (
                      <span key={p.seat}>
                        {p.name} · <b>{p.seat}</b>
                      </span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt>{t("ticket.class")}</dt>
                  <dd>
                    {BUS_CLASSES[booking.busClass].name[lang]} · {operator.name[lang]}
                  </dd>
                </div>
                <div>
                  <dt>{booking.payment === "station" ? t("ticket.payAtStation") : t("ticket.paid")}</dt>
                  <dd>{f.money(booking.price.total)}</dd>
                </div>
              </dl>
              {cancelled && <span className="ticket-stamp">{t("ticket.cancelled")}</span>}
            </section>
            <section className="ticket-face ticket-back" aria-hidden={!flipped}>
              <div className="ticket-qr" role="img" aria-label={t("ticket.qr", { ref: booking.ref })} dangerouslySetInnerHTML={{ __html: qr }} />
              <p className="ticket-ref-big">{booking.ref}</p>
              <p>{t("ticket.board")}</p>
            </section>
          </div>
        </div>
      </div>

      <div className="ticket-actions">
        <button type="button" className="btn btn-ghost" onClick={() => setFlipped(!flipped)} aria-pressed={flipped}>
          <RotateCcw size={17} aria-hidden="true" /> {t("ticket.flip")}
        </button>
        {!cancelled && (
          <button type="button" className="btn btn-ghost" onClick={addToCalendar}>
            <CalendarPlus size={17} aria-hidden="true" /> {t("ticket.calendar")}
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
          <Printer size={17} aria-hidden="true" /> {t("ticket.print")}
        </button>
        <Link className="btn btn-primary" to="/bookings" viewTransition>
          {t("nav.bookings")}
        </Link>
      </div>
    </div>
  );
}
