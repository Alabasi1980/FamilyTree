export function normalizeBasePath(value?: string | null) {
  if (!value) return "";

  let normalized = value.trim();
  if (!normalized || normalized === "/") return "";

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/+$/, "");
  return normalized === "/" ? "" : normalized;
}

export const appBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

export const appBasePathScope = appBasePath ? `${appBasePath}/` : "/";

export function withBasePath(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === "/") {
    return appBasePath || "/";
  }

  return `${appBasePath}${normalizedPath}`;
}