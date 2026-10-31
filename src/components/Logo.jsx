// Rihla's mark: a road that bends like the Nile, inside a sun.
export default function Logo({ size = 34 }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="logo-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4a261" />
          <stop offset="1" stopColor="#e76f51" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#logo-sun)" />
      <path d="M13 33c0-6 14-6 14-12S13 15 13 9" fill="none" stroke="#fff8ef" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M13 33c0-6 14-6 14-12S13 15 13 9" fill="none" stroke="#264653" strokeWidth="1" strokeDasharray="2 2.6" strokeLinecap="round" />
    </svg>
  );
}
