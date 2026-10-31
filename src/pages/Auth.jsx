import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Eye, EyeOff, Info } from "lucide-react";
import Logo from "../components/Logo.jsx";
import { isEmail, isFullName } from "../lib/validate.js";
import { useI18n } from "../i18n/I18n.jsx";
import { useApp } from "../state/app.jsx";

export default function Auth() {
  const location = useLocation();
  const signup = location.pathname.endsWith("signup");
  const { t } = useI18n();
  const { signIn, toast } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);

  useEffect(() => {
    document.title = `${t(signup ? "auth.signupTitle" : "auth.signinTitle")} · Rihla`;
  }, [signup, t]);

  useEffect(() => {
    formRef.current?.querySelector("[aria-invalid='true']")?.focus();
  }, [errors]);

  function submit(e) {
    e.preventDefault();
    const next = {};
    if (signup && !isFullName(name)) next.name = t("err.name");
    if (!isEmail(email)) next.email = t("err.email");
    if (password.length < 8) next.password = t("err.password");
    setErrors(next);
    if (Object.keys(next).length) return;
    // Signing in without an account uses the part of the email before the @ as a name
    const displayName = signup ? name.trim() : email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    signIn({ name: displayName, email: email.trim() });
    toast(t("toast.welcome", { name: displayName.split(" ")[0] }));
    navigate(location.state?.from ?? "/", { replace: true, viewTransition: true });
  }

  const field = (id, label, value, set, props = {}) => (
    <div className={`field ${errors[id] ? "is-invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field-control">
        <input id={id} value={value} onChange={(e) => set(e.target.value)} aria-invalid={errors[id] ? "true" : undefined} aria-describedby={errors[id] ? `${id}-error` : undefined} {...props} />
      </div>
      {errors[id] && (
        <p className="field-error" id={`${id}-error`}>
          {errors[id]}
        </p>
      )}
    </div>
  );

  return (
    <div className="page-auth container">
      <div className="auth-card card">
        <Logo size={44} />
        <h1>{t(signup ? "auth.signupTitle" : "auth.signinTitle")}</h1>
        <p className="muted">{t(signup ? "auth.signupLead" : "auth.signinLead")}</p>
        <form ref={formRef} onSubmit={submit} noValidate>
          {signup && field("name", t("auth.name"), name, setName, { autoComplete: "name" })}
          {field("email", t("auth.email"), email, setEmail, { type: "email", autoComplete: "email", dir: "ltr" })}
          <div className={`field ${errors.password ? "is-invalid" : ""}`}>
            <label htmlFor="password">{t("auth.password")}</label>
            <div className="field-control">
              <input
                id="password"
                type={show ? "text" : "password"}
                autoComplete={signup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={errors.password ? "true" : undefined}
                aria-describedby={errors.password ? "password-error" : undefined}
                dir="ltr"
              />
              <button type="button" className="icon-btn reveal-pw" onClick={() => setShow(!show)} aria-label={t(show ? "auth.hide" : "auth.show")} aria-pressed={show}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="field-error" id="password-error">
                {errors.password}
              </p>
            )}
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            {t(signup ? "auth.signup" : "auth.signin")}
          </button>
        </form>
        <p className="demo-note">
          <Info size={16} aria-hidden="true" /> {t("auth.demo")}
        </p>
        <p className="auth-switch">
          {t(signup ? "auth.haveAccount" : "auth.noAccount")}{" "}
          <Link to={signup ? "/signin" : "/signup"} viewTransition>
            {t(signup ? "auth.signin" : "auth.signup")}
          </Link>
        </p>
      </div>
    </div>
  );
}
