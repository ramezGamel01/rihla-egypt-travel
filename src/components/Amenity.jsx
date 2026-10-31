import { Armchair, Coffee, Snowflake, Toilet, Tv, Usb, Wifi } from "lucide-react";
import { useI18n } from "../i18n/I18n.jsx";

const ICONS = { ac: Snowflake, wifi: Wifi, usb: Usb, recline: Armchair, snacks: Coffee, toilet: Toilet, screen: Tv };

export function AmenityIcon({ id, size = 16 }) {
  const Icon = ICONS[id];
  return Icon ? <Icon size={size} aria-hidden="true" /> : null;
}

export default function AmenityList({ ids, labels = false }) {
  const { t } = useI18n();
  return (
    <ul className={`amenities ${labels ? "with-labels" : ""}`}>
      {ids.map((id) => (
        <li key={id} title={t(`amenity.${id}`)}>
          <AmenityIcon id={id} />
          {labels ? <span>{t(`amenity.${id}`)}</span> : <span className="sr-only">{t(`amenity.${id}`)}</span>}
        </li>
      ))}
    </ul>
  );
}
