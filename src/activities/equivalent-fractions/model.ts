import { equivalent, type Fraction } from '../../math/fractions';
export const rounds: { target: Fraction; denominator: number }[] = [
  {target: {numerator: 1, denominator: 2}, denominator: 4},
  {target: {numerator: 1, denominator: 3}, denominator: 6},
  {target: {numerator: 2, denominator: 3}, denominator: 9},
  {target: {numerator: 3, denominator: 4}, denominator: 8},
  {target: {numerator: 2, denominator: 5}, denominator: 10},
];
export interface State { round: number; numerator: number; solved: boolean; complete: boolean }
export const initialState: State = {round: 0, numerator: 0, solved: false, complete: false};
export type Action = {type: 'select'; numerator: number} | {type: 'next'} | {type: 'reset'};
export function reducer(state: State, action: Action): State {
  if (action.type === 'reset') return initialState;
  if (state.complete) return state;
  if (action.type === 'next') {
    if (!state.solved) return state;
    if (state.round === rounds.length - 1) return {...state, complete: true};
    return {round: state.round + 1, numerator: 0, solved: false, complete: false};
  }
  if (state.solved) return state;
  const round = rounds[state.round];
  if (!Number.isInteger(action.numerator) || action.numerator < 0 || action.numerator > round.denominator) return state;
  return {...state, numerator: action.numerator,
    solved: equivalent(round.target, {numerator: action.numerator, denominator: round.denominator})};
}
