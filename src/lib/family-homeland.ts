export type HomelandConfidence = "VERIFIED" | "LIKELY" | "UNDOCUMENTED" | "UNSPECIFIED";

export interface FamilyHomelandFields {
  homelandCountry?: string | null;
  homelandRegion?: string | null;
  homelandCity?: string | null;
}

export const unspecifiedHomelandKey = "_unspecified";

export function formatFamilyHomeland(family: FamilyHomelandFields) {
  return [family.homelandCountry, family.homelandRegion, family.homelandCity]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" - ");
}

export function getFamilyHomelandKey(family: FamilyHomelandFields) {
  const parts = [family.homelandCountry, family.homelandRegion, family.homelandCity]
    .map((part) => part?.trim() ?? "");

  if (!parts.some(Boolean)) return unspecifiedHomelandKey;

  return parts.map((part) => encodeURIComponent(part || "_")).join("~");
}

export function parseFamilyHomelandKey(key: string) {
  if (key === unspecifiedHomelandKey) {
    return {
      label: "\u0645\u0648\u0637\u0646 \u063a\u064a\u0631 \u0645\u062d\u062f\u062f",
      country: null,
      region: null,
      city: null,
      isUnspecified: true,
    };
  }

  const [country = "", region = "", city = ""] = key
    .split("~")
    .map((part) => {
      const decoded = decodeURIComponent(part);
      return decoded === "_" ? "" : decoded;
    });

  return {
    label: [country, region, city].filter(Boolean).join(" - "),
    country: country || null,
    region: region || null,
    city: city || null,
    isUnspecified: false,
  };
}

export function getHomelandConfidenceLabel(confidence?: HomelandConfidence | null) {
  switch (confidence) {
    case "VERIFIED":
      return "\u0645\u0624\u0643\u062f";
    case "LIKELY":
      return "\u0645\u0631\u062c\u062d";
    case "UNDOCUMENTED":
      return "\u063a\u064a\u0631 \u0645\u0648\u062b\u0642";
    default:
      return "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f";
  }
}
