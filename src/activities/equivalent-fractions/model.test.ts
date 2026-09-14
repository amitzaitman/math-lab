import { expect, it } from 'vitest';
import { initialState, reducer, rounds } from './model';
it('only advances after equality and resets cleanly', () => {
  expect(reducer(initialState, {type: 'next'})).toEqual(initialState);
  const solved = reducer(initialState, {type: 'select', numerator: 2});
  expect(solved.solved).toBe(true);
  expect(reducer(solved, {type: 'select', numerator: 0})).toEqual(solved);
  expect(reducer(solved, {type: 'next'}).round).toBe(1);
  expect(reducer(solved, {type: 'reset'})).toEqual(initialState);
});
it('rejects invalid selections', () => {
  expect(reducer(initialState, {type: 'select', numerator: 9})).toEqual(initialState);
});
it('completes all rounds without indexing past the end', () => {
  let state = initialState;
  for (const round of rounds) {
    state = reducer(state, {type: 'select', numerator: round.target.numerator * round.denominator / round.target.denominator});
    expect(state.solved).toBe(true);
    state = reducer(state, {type: 'next'});
  }
  expect(state.complete).toBe(true);
  expect(reducer(state, {type: 'next'})).toEqual(state);
});
