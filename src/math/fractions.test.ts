import { describe, expect, it } from 'vitest';
import { equivalent, snapFraction } from './fractions';
describe('fractions', () => {
  it('compares by value without changing the representation', () => {
    expect(equivalent({numerator: 1, denominator: 2}, {numerator: 2, denominator: 4})).toBe(true);
    expect(equivalent({numerator: 1, denominator: 3}, {numerator: 2, denominator: 4})).toBe(false);
    expect(equivalent({numerator: 0, denominator: 3}, {numerator: 0, denominator: 4})).toBe(true);
  });
  it('rejects invalid fractions', () => {
    expect(() => equivalent({numerator: 1, denominator: 0}, {numerator: 1, denominator: 2})).toThrow();
  });
  it('snaps and clamps at both ends', () => {
    expect(snapFraction(0.51, 4)).toBe(2);
    expect(snapFraction(-1, 4)).toBe(0);
    expect(snapFraction(2, 4)).toBe(4);
    expect(() => snapFraction(NaN, 4)).toThrow();
  });
});
