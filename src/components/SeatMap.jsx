// The 2D seat map. Seats are toggle buttons in a grid; arrow keys move between
// them (one tab stop for the whole map), Space or Enter picks.
import { useRef, useState } from "react";
import { BUS_CLASSES } from "../data/network.js";
import { useI18n } from "../i18n/I18n.jsx";

export default function SeatMap({ busClass, taken, picked, onToggle }) {
  const { t } = useI18n();
  const layout = BUS_CLASSES[busClass].layout;
  const cols = layout.seats.length;
  const [focus, setFocus] = useState("A1");
  const refs = useRef({});

  const grid = [];
  for (let r = 0; r < layout.rows; r++) {
    const row = String.fromCharCode(65 + r);
    grid.push(layout.seats.map((n) => (n ? `${row}${n}` : null)));
  }
  const windowSeat = (col) => col === 0 || col === cols - 1;

  function move(label, dr, dc) {
    const r0 = label.charCodeAt(0) - 65;
    let c0 = grid[r0].indexOf(label);
    let r = r0;
    // Step over the aisle and off the ends of a row
    do {
      c0 += dc;
      if (c0 < 0 || c0 >= cols) return;
    } while (dc && grid[r][c0] === null);
    if (dr) {
      r = Math.min(layout.rows - 1, Math.max(0, r0 + dr));
      c0 = grid[r0].indexOf(label);
    }
    const next = grid[r][c0];
    if (next) {
      setFocus(next);
      refs.current[next]?.focus();
    }
  }

  function onKeyDown(e, label) {
    const rtl = document.documentElement.dir === "rtl";
    const keys = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, rtl ? 1 : -1], ArrowRight: [0, rtl ? -1 : 1] };
    if (keys[e.key]) {
      e.preventDefault();
      move(label, ...keys[e.key]);
    }
  }

  return (
    <div className="seat-map" role="group" aria-label={t("seats.mapLabel")}>
      <div className="seat-map-front">
        <span className="seat-driver" aria-hidden="true">
          {t("seats.driver")}
        </span>
        <span className="seat-front-label">{t("seats.front")}</span>
      </div>
      <div className="seat-grid" style={{ gridTemplateColumns: layout.seats.map((n) => (n ? "1fr" : "0.55fr")).join(" ") }}>
        {grid.flatMap((row, r) =>
          row.map((label, c) => {
            if (!label) return <span key={`a${r}-${c}`} className="seat-aisle" aria-hidden="true" />;
            const isTaken = taken.has(label);
            const isPicked = picked.includes(label);
            const where = t(windowSeat(c) ? "seats.window" : "seats.aisle");
            const state = isTaken ? t("seats.taken") : isPicked ? t("seats.selected") : t("seats.available");
            return (
              <button
                key={label}
                ref={(el) => (refs.current[label] = el)}
                type="button"
                className={`seat ${isTaken ? "is-taken" : ""} ${isPicked ? "is-picked" : ""}`}
                aria-pressed={isPicked}
                aria-disabled={isTaken || undefined}
                aria-label={`${t("seats.seat", { label })}, ${where}, ${state}`}
                tabIndex={label === focus ? 0 : -1}
                onFocus={() => setFocus(label)}
                onKeyDown={(e) => onKeyDown(e, label)}
                onClick={() => !isTaken && onToggle(label)}
              >
                <span aria-hidden="true">{label}</span>
              </button>
            );
          })
        )}
      </div>
      <ul className="seat-legend">
        <li>
          <span className="swatch" /> {t("seats.available")}
        </li>
        <li>
          <span className="swatch is-picked" /> {t("seats.selected")}
        </li>
        <li>
          <span className="swatch is-taken" /> {t("seats.taken")}
        </li>
      </ul>
    </div>
  );
}
