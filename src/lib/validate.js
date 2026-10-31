// Form checks shared by checkout and sign-in. Each returns true when the value is acceptable.

// Arabic or Latin letters, at least two words
export function isFullName(value) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return words.length >= 2 && words.every((w) => /^[\p{L}'.-]{2,}$/u.test(w));
}

// Egyptian mobile: 01x xxxx xxxx, optionally written with +20
export function normalizePhone(value) {
  const digits = toLatinDigits(value).replace(/[^\d+]/g, "");
  if (digits.startsWith("+20")) return `0${digits.slice(3)}`;
  if (digits.startsWith("0020")) return `0${digits.slice(4)}`;
  return digits;
}

export function isEgyptianMobile(value) {
  return /^01[0125]\d{8}$/.test(normalizePhone(value));
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

// Arabic-Indic digits typed on an Arabic keyboard count as numbers too
export function toLatinDigits(value) {
  return value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0));
}

export function luhn(number) {
  const digits = toLatinDigits(number).replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function isFutureExpiry(value, now = new Date()) {
  const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(toLatinDigits(value).trim());
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  // Valid through the end of the expiry month
  return new Date(year, month, 1) > now;
}

export function formatCardNumber(value) {
  return toLatinDigits(value)
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatExpiry(value) {
  const digits = toLatinDigits(value).replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}
