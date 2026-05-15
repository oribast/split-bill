import { describe, it, expect } from 'vitest';
import { splitEqual, splitIndividual } from './split';

describe('splitEqual', () => {
  it('distributes 100 cents among 3 participants as 34, 33, 33', () => {
    const ids = ['a', 'b', 'c'].sort();
    const result = splitEqual(100, ids);
    const shares = result.map((r) => r.share);
    expect(shares).toEqual([34, 33, 33]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('distributes 5 cents among 2 participants as 3, 2', () => {
    const ids = ['x', 'y'].sort();
    const result = splitEqual(5, ids);
    const shares = result.map((r) => r.share);
    expect(shares).toEqual([3, 2]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(5);
  });

  it('distributes remainder to first N sorted participants', () => {
    const result = splitEqual(7, ['b', 'a']);
    expect(result.find((r) => r.participantId === 'a')?.share).toBe(4);
    expect(result.find((r) => r.participantId === 'b')?.share).toBe(3);
  });
});

describe('splitIndividual', () => {
  it('assigns full amount to payer and splits share equally', () => {
    const result = splitIndividual('p1', ['p1', 'p2', 'p3'], 100);
    const payer = result.find((r) => r.participantId === 'p1');
    expect(payer?.amount).toBe(100);
    expect(payer?.share).toBe(34);
    const others = result.filter((r) => r.participantId !== 'p1');
    expect(others.every((o) => o.amount === 0)).toBe(true);
    const totalShare = result.reduce((sum, r) => sum + r.share, 0);
    expect(totalShare).toBe(100);
  });

  it('throws if payer is not in participants', () => {
    expect(() => splitIndividual('p0', ['p1', 'p2'], 100)).toThrow('Payer must be in participants');
  });
});
