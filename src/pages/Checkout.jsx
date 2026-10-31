import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { Banknote, Check, CreditCard, Info, Tag, Timer, Wallet } from "lucide-react";
import Summary from "../components/Summary.jsx";
import Dialog from "../components/Dialog.jsx";
import { cityName } from "../data/cities.js";
import { getTrip, operatorOf, seatLabels, takenSeats } from "../data/trips.js";
import { priceBreakdown, promoRate } from "../lib/pricing.js";
import { formatCardNumber, formatExpiry, isEgyptianMobile, isEmail, isFullName, isFutureExpiry, luhn, normalizePhone } from "../lib/validate.js";
import { addBooking, seatsBookedOn } from "../state/bookings.js";
import { useI18n } from "../i18n/I18n.jsx";
import { useApp } from "../state/app.jsx";
import { store } from "../lib/storage.js";

const HOLD_MS = 10 * 60 * 1000;
const TEST_CARD = { number: "4242 4242 4242 4242", expiry: "12/30", cvc: "123" };

function useHold(key) {
  const [deadline] = useState(() => {
    const saved = Number(sessionStorage.getItem(key));
    if (saved && saved > Date.now()) return saved;
    const next = Date.now() + HOLD_MS;
    sessionStorage.setItem(key, String(next));
    return next;
  });
  const [left, setLeft] = useState(deadline - Date.now());
  useEffect(() => {
    const timer = setInterval(() => setLeft(deadline - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  return Math.max(0, left);
}

function Field({ id, label, error, hint, children }) {
  return (
    <div className={`field ${error ? "is-invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

function Steps({ step }) {
  const { t } = useI18n();
  const names = ["step.passengers", "step.payment", "step.ticket"];
  return (
    <ol className="steps" aria-label={t("checkout.steps")}>
      {names.map((n, i) => (
        <li key={n} className={i < step ? "is-done" : i === step ? "is-current" : ""} aria-current={i === step ? "step" : undefined}>
          <span className="step-dot">{i < step ? <Check size={14} aria-hidden="true" /> : i + 1}</span>
          {t(n)}
        </li>
      ))}
    </ol>
  );
}

export default function Checkout() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { t, lang, f } = useI18n();
  const { user, toast } = useApp();
  const navigate = useNavigate();
  const trip = useMemo(() => getTrip(id), [id]);
  const seats = useMemo(() => (params.get("seats") ?? "").split(",").filter(Boolean), [params]);
  const holdKey = `rihla:hold:${id}:${seats.join(",")}`;
  const left = useHold(holdKey);

  const [step, setStep] = useState(0);
  const [names, setNames] = useState(() => seats.map((_, i) => (i === 0 && user ? user.name : "")));
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [method, setMethod] = useState("card");
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);

  const valid = useMemo(() => {
    if (!trip || !seats.length) return false;
    const all = new Set(seatLabels(trip.busClass));
    const taken = new Set([...takenSeats(trip), ...seatsBookedOn(trip.id)]);
    return seats.every((s) => all.has(s) && !taken.has(s));
  }, [trip, seats]);

  useEffect(() => {
    document.title = `${t("checkout.title")} · Rihla`;
  }, [t]);

  // Move focus to the first problem so keyboard and screen reader users land on it
  useEffect(() => {
    const first = formRef.current?.querySelector("[aria-invalid='true']");
    first?.focus();
  }, [errors]);

  if (!trip || !valid) {
    return (
      <div className="container page-narrow">
        <div className="empty card">
          <h1>{t("checkout.missing")}</h1>
          <Link className="btn btn-primary" to={trip ? `/trip/${trip.id}` : "/"}>
            {t(trip ? "checkout.restart" : "notFound.home")}
          </Link>
        </div>
      </div>
    );
  }

  const operator = operatorOf(trip);
  const price = priceBreakdown(trip.price, seats.length, promo);
  const expired = left <= 0;
  const mm = String(Math.floor(left / 60000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
  const clock = lang === "ar" ? f.number(Number(mm)).padStart(2, "٠") + ":" + f.number(Number(ss)).padStart(2, "٠") : `${mm}:${ss}`;

  function checkPassengers() {
    const next = {};
    names.forEach((n, i) => !isFullName(n) && (next[`name${i}`] = t("err.name")));
    if (!isEgyptianMobile(phone)) next.phone = t("err.phone");
    if (!isEmail(email)) next.email = t("err.email");
    setErrors(next);
    return !Object.keys(next).length;
  }

  function checkPayment() {
    const next = {};
    if (method === "card") {
      if (!luhn(card.number)) next.number = t("err.card");
      if (!isFutureExpiry(card.expiry)) next.expiry = t("err.expiry");
      if (!/^\d{3}$/.test(card.cvc)) next.cvc = t("err.cvc");
      if (card.name.trim().length < 3) next.cardName = t("err.cardName");
    }
    setErrors(next);
    return !Object.keys(next).length;
  }

  function submitPassengers(e) {
    e.preventDefault();
    if (checkPassengers()) {
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function submitPayment(e) {
    e.preventDefault();
    if (!checkPayment()) return;
    setBusy(true);
    // A short pause stands in for the payment provider
    setTimeout(() => {
      const booking = addBooking({
        tripId: trip.id,
        from: trip.from,
        to: trip.to,
        departAt: trip.departAt,
        arriveAt: trip.arriveAt,
        operator: trip.operator,
        busClass: trip.busClass,
        seats,
        passengers: names.map((name, i) => ({ name: name.trim(), seat: seats[i] })),
        contact: { phone: normalizePhone(phone), email: email.trim() },
        payment: method,
        cardLast4: method === "card" ? card.number.replace(/\D/g, "").slice(-4) : null,
        price,
      });
      sessionStorage.removeItem(holdKey);
      store.set("rihla:lastBooking", booking.ref);
      toast(t("toast.booked"));
      navigate(`/ticket/${booking.ref}`, { state: { fresh: true }, viewTransition: true, replace: true });
    }, 1100);
  }

  function applyPromo() {
    if (promoRate(promoInput)) {
      setPromo(promoInput.trim().toUpperCase());
      setPromoMsg(t("pay.promoOk"));
    } else {
      setPromo("");
      setPromoMsg(t("pay.promoBad"));
    }
  }

  const err = (key) => errors[key];
  const aria = (key, hint) => ({
    "aria-invalid": err(key) ? "true" : undefined,
    "aria-describedby": err(key) ? `${key}-error` : hint ? `${key}-hint` : undefined,
  });

  return (
    <div className="page-checkout container">
      <div className="checkout-top">
        <h1>{t("checkout.title")}</h1>
        <p className={`hold ${left < 120000 ? "is-low" : ""}`} role="timer" aria-live="off">
          <Timer size={16} aria-hidden="true" /> {t("checkout.hold", { time: clock })}
        </p>
      </div>
      <Steps step={step} />
      <div className="trip-layout">
        <div className="checkout-main">
          {Object.keys(errors).length > 0 && (
            <p className="form-alert" role="alert">
              {t("err.summary")}
            </p>
          )}
          {step === 0 ? (
            <form ref={formRef} className="card form-card" onSubmit={submitPassengers} noValidate>
              <h2>{t("pass.title")}</h2>
              <div className="pass-grid">
                {seats.map((seat, i) => (
                  <Field key={seat} id={`name${i}`} label={`${t("pass.name")} · ${t("pass.seat", { label: seat })}`} error={err(`name${i}`)}>
                    <input
                      id={`name${i}`}
                      autoComplete={i === 0 ? "name" : "off"}
                      value={names[i]}
                      onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))}
                      {...aria(`name${i}`)}
                    />
                  </Field>
                ))}
              </div>
              <h3>{t("pass.contact")}</h3>
              <p className="muted">{t("pass.contactHint")}</p>
              <div className="pass-grid">
                <Field id="phone" label={t("pass.phone")} error={err("phone")} hint={t("pass.phoneHint")}>
                  <input id="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} {...aria("phone", true)} />
                </Field>
                <Field id="email" label={t("pass.email")} error={err("email")}>
                  <input id="email" type="email" autoComplete="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} {...aria("email")} />
                </Field>
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                {t("pass.next")}
              </button>
            </form>
          ) : (
            <form ref={formRef} className="card form-card" onSubmit={submitPayment} noValidate>
              <h2>{t("pay.title")}</h2>
              <div className="pay-methods" role="radiogroup" aria-label={t("pay.title")}>
                {[
                  ["card", CreditCard, t("pay.card")],
                  ["wallet", Wallet, t("pay.wallet")],
                  ["station", Banknote, t("pay.station")],
                ].map(([key, Icon, label]) => (
                  <label key={key} className={`pay-method ${method === key ? "is-on" : ""}`}>
                    <input type="radio" name="method" value={key} checked={method === key} onChange={() => (setMethod(key), setErrors({}))} />
                    <Icon size={22} aria-hidden="true" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <p className="demo-note">
                <Info size={16} aria-hidden="true" /> {t("pay.demo")}
              </p>
              {method === "card" && (
                <div className="card-form">
                  <div className={`card-preview ${card.number.startsWith("4") ? "is-visa" : ""}`} aria-hidden="true">
                    <span className="cp-chip" />
                    <span className="cp-number">{card.number || "•••• •••• •••• ••••"}</span>
                    <span className="cp-row">
                      <span>{card.name || "RIHLA DEMO"}</span>
                      <span>{card.expiry || "MM/YY"}</span>
                    </span>
                  </div>
                  <button type="button" className="link-btn" onClick={() => setCard({ ...TEST_CARD, name: names[0] })}>
                    {t("pay.testCard")}
                  </button>
                  <div className="pass-grid">
                    <Field id="number" label={t("pay.cardNumber")} error={err("number")}>
                      <input id="number" inputMode="numeric" autoComplete="off" dir="ltr" value={card.number} onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })} {...aria("number")} />
                    </Field>
                    <Field id="cardName" label={t("pay.cardName")} error={err("cardName")}>
                      <input id="cardName" autoComplete="off" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} {...aria("cardName")} />
                    </Field>
                    <Field id="expiry" label={t("pay.expiry")} error={err("expiry")}>
                      <input id="expiry" inputMode="numeric" autoComplete="off" dir="ltr" placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} {...aria("expiry")} />
                    </Field>
                    <Field id="cvc" label={t("pay.cvc")} error={err("cvc")}>
                      <input id="cvc" inputMode="numeric" autoComplete="off" dir="ltr" maxLength={3} value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 3) })} {...aria("cvc")} />
                    </Field>
                  </div>
                </div>
              )}
              {method === "wallet" && <p className="method-hint">{t("pay.walletHint", { phone: normalizePhone(phone) })}</p>}
              {method === "station" && <p className="method-hint">{t("pay.stationHint", { operator: operator.name[lang] })}</p>}
              <div className="promo">
                <label htmlFor="promo">
                  <Tag size={16} aria-hidden="true" /> {t("pay.promo")}
                </label>
                <div className="promo-row">
                  <input id="promo" dir="ltr" value={promoInput} placeholder={t("pay.promoHint")} onChange={(e) => setPromoInput(e.target.value)} />
                  <button type="button" className="btn btn-ghost" onClick={applyPromo}>
                    {t("pay.apply")}
                  </button>
                </div>
                <p className={`promo-msg ${promo ? "is-ok" : ""}`} role="status">
                  {promoMsg}
                </p>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => (setStep(0), setErrors({}))}>
                  {t("back")}
                </button>
                <button type="submit" className={`btn btn-primary ${busy ? "is-busy" : ""}`} disabled={busy || expired}>
                  {busy ? t("pay.processing") : method === "station" ? t("pay.book") : t("pay.submit", { total: f.money(price.total) })}
                </button>
              </div>
            </form>
          )}
        </div>
        <Summary trip={trip} seats={seats} promo={promo}>
          <p className="summary-note">
            {cityName(trip.from, lang)} → {cityName(trip.to, lang)}
          </p>
        </Summary>
      </div>
      <Dialog
        open={expired && !busy}
        onClose={() => navigate(`/trip/${trip.id}?pax=${seats.length}`)}
        title={t("checkout.expired")}
        actions={
          <Link className="btn btn-primary" to={`/trip/${trip.id}?pax=${seats.length}`} onClick={() => sessionStorage.removeItem(holdKey)}>
            {t("checkout.restart")}
          </Link>
        }
      >
        <p>{t("checkout.expiredHint")}</p>
      </Dialog>
    </div>
  );
}
