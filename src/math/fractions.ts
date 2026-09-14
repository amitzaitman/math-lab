export interface Fraction { numerator: number; denominator: number }
export function validateFraction(f: Fraction): void {
  if (!Number.isSafeInteger(f.numerator) || !Number.isSafeInteger(f.denominator) ||
      f.numerator < 0 || f.denominator < 1 || f.numerator > f.denominator) {
    throw new RangeError('Expected a fraction between zero and one');
  }
}
export function equivalent(a: Fraction, b: Fraction): boolean {
  validateFraction(a); validateFraction(b);
  // BigInt avoids unsafe cross products even for valid safe-integer inputs.
  return BigInt(a.numerator) * BigInt(b.denominator) === BigInt(b.numerator) * BigInt(a.denominator);
}
export function snapFraction(ratio: number, denominator: number): number {
  if (!Number.isFinite(ratio) || !Number.isSafeInteger(denominator) || denominator < 1)
    throw new RangeError('Invalid snapping input');
  return Math.round(Math.max(0, Math.min(1, ratio)) * denominator);
}
