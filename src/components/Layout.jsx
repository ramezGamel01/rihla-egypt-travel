import { Outlet, ScrollRestoration, useNavigation } from "react-router";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import Toasts from "./Toasts.jsx";
import { useI18n } from "../i18n/I18n.jsx";

export default function Layout() {
  const { t } = useI18n();
  const navigation = useNavigation();
  return (
    <>
      <a className="skip-link" href="#main">
        {t("nav.skip")}
      </a>
      <div className={`route-progress ${navigation.state !== "idle" ? "is-active" : ""}`} aria-hidden="true" />
      <Header />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <Toasts />
      <ScrollRestoration />
    </>
  );
}
