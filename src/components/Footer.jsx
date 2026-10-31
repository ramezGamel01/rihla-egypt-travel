import { Link } from "react-router";
import { CodeXml, Pause, Play } from "lucide-react";
import Logo from "./Logo.jsx";
import { useI18n } from "../i18n/I18n.jsx";
import { useApp } from "../state/app.jsx";

export default function Footer() {
  const { t } = useI18n();
  const { motion, setMotion } = useApp();
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link to="/" className="brand" aria-label="Rihla">
            <Logo size={30} />
            <span className="brand-name">
              Rihla <span lang="ar">رحلة</span>
            </span>
          </Link>
          <p className="footer-demo">{t("footer.demo")}</p>
        </div>
        <div className="footer-meta">
          <button type="button" className="chip-btn" onClick={() => setMotion(!motion)} aria-pressed={!motion}>
            {motion ? <Pause size={15} /> : <Play size={15} />}
            {t(motion ? "nav.motionOff" : "nav.motionOn")}
          </button>
          <a className="chip-btn" href="https://github.com/ramezGamel01/rihla-egypt-travel">
            <CodeXml size={15} />
            {t("footer.code")}
          </a>
          <p className="footer-by">
            {t("footer.by")} <a href="https://ramezgamel.vercel.app">Ramez Gamel</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
