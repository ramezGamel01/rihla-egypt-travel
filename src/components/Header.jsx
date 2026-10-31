import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import Logo from "./Logo.jsx";
import { useI18n } from "../i18n/I18n.jsx";
import { useApp } from "../state/app.jsx";
import { store } from "../lib/storage.js";

export default function Header() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme, user, signOut, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // "Trips" returns to the last search when there is one
  const lastSearch = store.get("rihla:lastSearch");
  const tripsHref = lastSearch ? `/trips?${lastSearch}` : "/trips";
  const onHome = location.pathname === "/";

  const links = (
    <>
      <NavLink to="/" end viewTransition>
        {t("nav.home")}
      </NavLink>
      <NavLink to={tripsHref} viewTransition className={({ isActive }) => (isActive || location.pathname.startsWith("/trip") ? "active" : "")}>
        {t("nav.trips")}
      </NavLink>
      <NavLink to="/bookings" viewTransition>
        {t("nav.bookings")}
      </NavLink>
    </>
  );

  return (
    <header className={`site-header ${solid || !onHome ? "is-solid" : ""} ${open ? "is-open" : ""}`}>
      <div className="container header-inner">
        <Link to="/" className="brand" viewTransition aria-label="Rihla">
          <Logo />
          <span className="brand-name">
            Rihla <span lang="ar">رحلة</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label={t("nav.main")}>
          {links}
        </nav>

        <div className="header-actions">
          <button type="button" className="icon-btn lang-btn" onClick={() => setLang(lang === "ar" ? "en" : "ar")} aria-label={t("nav.langLabel")}>
            <span lang={lang === "ar" ? "en" : "ar"}>{t("nav.lang")}</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={t(theme === "dark" ? "nav.toLight" : "nav.toDark")}
            title={t(theme === "dark" ? "nav.toLight" : "nav.toDark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user ? (
            <div className="account">
              <span className="avatar" aria-hidden="true">
                {user.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </span>
              <span className="account-name">{t("hello", { name: user.name.split(/\s+/)[0] })}</span>
              <button
                type="button"
                className="icon-btn"
                aria-label={t("nav.signout")}
                title={t("nav.signout")}
                onClick={() => {
                  signOut();
                  toast(t("toast.signedOut"));
                  navigate("/");
                }}
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <Link to="/signin" className="btn btn-small btn-primary signin-btn" viewTransition>
              {t("nav.signin")}
            </Link>
          )}
          <button type="button" className="icon-btn burger" aria-expanded={open} aria-controls="mobile-nav" aria-label={t("nav.menu")} onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <nav id="mobile-nav" className="mobile-nav" aria-label={t("nav.main")} hidden={!open}>
        {links}
        {!user && (
          <NavLink to="/signin" viewTransition>
            {t("nav.signin")}
          </NavLink>
        )}
      </nav>
    </header>
  );
}
