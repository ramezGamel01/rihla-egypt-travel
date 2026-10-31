// Cities Rihla connects. Coordinates place them on the 3D map; images are optional.
export const CITIES = [
  {
    id: "CAI",
    name: { en: "Cairo", ar: "القاهرة" },
    region: { en: "Nile Valley", ar: "وادي النيل" },
    blurb: {
      en: "The pyramids of Giza, Khan el-Khalili and a city that never sleeps on the Nile.",
      ar: "أهرامات الجيزة وخان الخليلي ومدينة لا تنام على ضفاف النيل.",
    },
    lat: 30.04,
    lon: 31.24,
    image: "cairo",
  },
  {
    id: "ALX",
    name: { en: "Alexandria", ar: "الإسكندرية" },
    region: { en: "Mediterranean coast", ar: "ساحل البحر المتوسط" },
    blurb: {
      en: "Sea breeze along the Corniche, seafood and the Library of Alexandria.",
      ar: "نسيم البحر على الكورنيش، والمأكولات البحرية، ومكتبة الإسكندرية.",
    },
    lat: 31.2,
    lon: 29.92,
    image: null,
  },
  {
    id: "LXR",
    name: { en: "Luxor", ar: "الأقصر" },
    region: { en: "Upper Egypt", ar: "صعيد مصر" },
    blurb: {
      en: "Karnak, Luxor Temple and the Valley of the Kings on the west bank.",
      ar: "معبد الكرنك ومعبد الأقصر ووادي الملوك على البر الغربي.",
    },
    lat: 25.69,
    lon: 32.64,
    image: "luxor",
  },
  {
    id: "ASW",
    name: { en: "Aswan", ar: "أسوان" },
    region: { en: "Upper Egypt", ar: "صعيد مصر" },
    blurb: {
      en: "Feluccas on the Nile, Philae Temple and colourful Nubian villages.",
      ar: "المراكب الشراعية في النيل، ومعبد فيلة، والقرى النوبية الملونة.",
    },
    lat: 24.09,
    lon: 32.9,
    image: "aswan",
  },
  {
    id: "HRG",
    name: { en: "Hurghada", ar: "الغردقة" },
    region: { en: "Red Sea", ar: "البحر الأحمر" },
    blurb: {
      en: "Coral reefs, long sandy beaches and boat trips to the islands.",
      ar: "الشعاب المرجانية والشواطئ الرملية الطويلة ورحلات القوارب إلى الجزر.",
    },
    lat: 27.26,
    lon: 33.81,
    image: "hurghada",
  },
  {
    id: "SSH",
    name: { en: "Sharm El-Sheikh", ar: "شرم الشيخ" },
    region: { en: "South Sinai", ar: "جنوب سيناء" },
    blurb: {
      en: "Ras Mohammed, Naama Bay and sunsets over the Red Sea.",
      ar: "رأس محمد وخليج نعمة وغروب الشمس على البحر الأحمر.",
    },
    lat: 27.92,
    lon: 34.33,
    image: "red-sea",
  },
  {
    id: "DAH",
    name: { en: "Dahab", ar: "دهب" },
    region: { en: "South Sinai", ar: "جنوب سيناء" },
    blurb: {
      en: "The Blue Hole, slow cafés by the water and hikes into the mountains.",
      ar: "الحفرة الزرقاء والمقاهي الهادئة على الماء ورحلات المشي في الجبال.",
    },
    lat: 28.5,
    lon: 34.51,
    image: null,
  },
  {
    id: "SIW",
    name: { en: "Siwa", ar: "سيوة" },
    region: { en: "Western Desert", ar: "الصحراء الغربية" },
    blurb: {
      en: "Salt lakes, date palms, desert springs and the Oracle of Amun.",
      ar: "البحيرات المالحة والنخيل والعيون الصحراوية ومعبد آمون.",
    },
    lat: 29.2,
    lon: 25.52,
    image: "siwa",
  },
  {
    id: "PSD",
    name: { en: "Port Said", ar: "بورسعيد" },
    region: { en: "Suez Canal", ar: "قناة السويس" },
    blurb: {
      en: "Ships gliding through the Suez Canal and a historic harbour.",
      ar: "سفن تعبر قناة السويس وميناء عريق.",
    },
    lat: 31.26,
    lon: 32.3,
    image: null,
  },
];

export const CITY_BY_ID = Object.fromEntries(CITIES.map((c) => [c.id, c]));

export function cityName(id, lang) {
  return CITY_BY_ID[id]?.name[lang] ?? id;
}
