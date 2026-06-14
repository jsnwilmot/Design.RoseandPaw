const MAX_URL_LENGTH = 2048;
const LOCAL_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa"];

const parseIpv4 = (hostname) => {
  const parts = hostname.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) {
    return null;
  }

  const octets = parts.map(Number);
  return octets.every((octet) => octet >= 0 && octet <= 255) ? octets : null;
};

const isPrivateIpv4 = (hostname) => {
  const octets = parseIpv4(hostname);
  if (!octets) return false;

  const [first, second] = octets;
  return first === 0
    || first === 10
    || first === 127
    || (first === 100 && second >= 64 && second <= 127)
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 0)
    || (first === 192 && second === 168)
    || (first === 198 && (second === 18 || second === 19))
    || first >= 224;
};

const isPrivateIpv6 = (hostname) => {
  const address = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!address.includes(":")) return false;

  if (address === "::" || address === "::1") return true;
  if (/^f[cd]/.test(address) || /^fe[89a-f]/.test(address) || /^ff/.test(address)) return true;
  if (address.startsWith("2001:db8:")) return true;

  const mappedIpv4 = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mappedIpv4) return isPrivateIpv4(mappedIpv4);

  const mappedHex = address.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (!mappedHex) return false;
  const high = Number.parseInt(mappedHex[1], 16);
  const low = Number.parseInt(mappedHex[2], 16);
  return isPrivateIpv4(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
};

const isLocalHostname = (hostname) => {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return normalized === "localhost"
    || LOCAL_HOST_SUFFIXES.some((suffix) => normalized.endsWith(suffix))
    || isPrivateIpv4(normalized)
    || isPrivateIpv6(normalized);
};

const isValidHostname = (hostname) => {
  if (hostname.includes(":")) return true;
  return hostname.length <= 253 && hostname.split(".").every((label) => (
    label.length > 0
    && label.length <= 63
    && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)
  ));
};

export const normalizePublicUrl = (input) => {
  if (typeof input !== "string") {
    throw new Error("invalid_url");
  }

  const trimmed = input.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH || /[\u0000-\u001f\u007f]/.test(trimmed)) {
    throw new Error("invalid_url");
  }

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url;

  try {
    url = new URL(candidate);
  } catch (error) {
    throw new Error("invalid_url");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("unsupported_url");
  }
  if (url.username || url.password) {
    throw new Error("embedded_credentials");
  }
  if (!url.hostname || isLocalHostname(url.hostname)) {
    throw new Error("private_url");
  }
  if ((!url.hostname.includes(".") && !url.hostname.includes(":")) || !isValidHostname(url.hostname)) {
    throw new Error("invalid_url");
  }

  url.hash = "";
  return url.href;
};

export { isLocalHostname, isPrivateIpv4, isPrivateIpv6 };
