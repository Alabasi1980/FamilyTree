export type ValidationResult = {
  status: "ALLOWED" | "PROHIBITED" | "REQUIRES_REVIEW" | "INSUFFICIENT_DATA";
  code: string;
  message: string;
  blocking: boolean;
  warnings?: string[];
};

export function allowed(warnings?: string[]): ValidationResult {
  return { status: "ALLOWED", code: "ALLOWED", message: "", blocking: false, warnings };
}

export function prohibited(code: string, message: string): ValidationResult {
  return { status: "PROHIBITED", code, message, blocking: true };
}

export function insufficientData(code: string, message: string): ValidationResult {
  return { status: "INSUFFICIENT_DATA", code, message, blocking: false };
}
