import { useEffect } from "react";
import { Link } from "react-router";
import { Bus } from "lucide-react";
import { useI18n } from "../i18n/I18n.jsx";

export default function NotFound() {
  const { t } = useI18n();
  useEffect(() => {
    document.title = `404 · Rihla`;
  }, []);
  return (
    <div className="page-404 container">
      <div className="road-404" aria-hidden="true">
        <span className="road-404-num">404</span>
        <span className="road-404-bus">
          <Bus size={34} />
        </span>
      </div>
      <h1>{t("notFound.title")}</h1>
      <Link className="btn btn-primary" to="/" viewTransition>
        {t("notFound.home")}
      </Link>
    </div>
  );
}
