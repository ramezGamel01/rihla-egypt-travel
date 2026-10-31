// A city picker that follows the ARIA combobox pattern: type to filter,
// arrow keys to move, Enter to choose, Escape to close.
import { useId, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { CITIES, cityName } from "../data/cities.js";
import { useI18n } from "../i18n/I18n.jsx";

export default function CityCombobox({ label, value, onChange, options, groupLabel, invalid }) {
  const { t, lang } = useI18n();
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  const text = query ?? (value ? cityName(value, lang) : "");
  const pool = options ? CITIES.filter((c) => options.includes(c.id)) : CITIES;
  const matches = useMemo(() => {
    const q = (query ?? "").trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((c) => c.name.en.toLowerCase().includes(q) || c.name.ar.includes(q) || c.id.toLowerCase() === q);
  }, [pool, query]);

  function choose(city) {
    onChange(city.id);
    setQuery(null);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (matches.length ? (i + step + matches.length) % matches.length : 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      if (matches[active]) choose(matches[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(null);
    }
  }

  return (
    <div className={`field city-field ${invalid ? "is-invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field-control">
        <MapPin size={18} aria-hidden="true" className="field-icon" />
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${listId}-${matches[active].id}` : undefined}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          placeholder={t("search.pick")}
          value={text}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={(e) => {
            e.target.select();
            setOpen(true);
          }}
          onBlur={() => {
            setOpen(false);
            setQuery(null);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && (
        <ul className="combo-list" id={listId} role="listbox" aria-label={groupLabel ?? label}>
          {groupLabel && (
            <li className="combo-group" role="presentation">
              {groupLabel}
            </li>
          )}
          {matches.map((city, i) => (
            <li
              key={city.id}
              id={`${listId}-${city.id}`}
              role="option"
              aria-selected={city.id === value}
              className={i === active ? "is-active" : ""}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(city);
              }}
            >
              <span className="combo-name">{city.name[lang]}</span>
              <span className="combo-region">{city.region[lang]}</span>
            </li>
          ))}
          {!matches.length && (
            <li className="combo-empty" role="presentation">
              {t("search.noMatch", { q: query })}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
