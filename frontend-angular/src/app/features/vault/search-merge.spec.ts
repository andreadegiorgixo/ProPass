import { makePassword } from '../../testing/fixtures';
import { byName, mergeResults } from './search-merge';

describe('mergeResults', () => {
  it('unisce gli elenchi senza duplicati, riconoscendoli dall\'id', () => {
    const github = makePassword(1, 'GitHub');
    const gmail = makePassword(2, 'Gmail');
    const banca = makePassword(3, 'Banca');

    // GitHub compare sia nella ricerca per nome sia in quella per link.
    const merged = mergeResults([[github, gmail], [github, banca], [github]]);

    expect(merged.map((item) => item.id).sort()).toEqual([1, 2, 3]);
  });

  it('tiene la prima copia incontrata di un id', () => {
    const first = makePassword(1, 'GitHub', { note: 'prima' });
    const second = makePassword(1, 'GitHub', { note: 'seconda' });

    expect(mergeResults([[first], [second]])[0]?.note).toBe('prima');
  });

  it('ordina per nome senza distinguere maiuscole, minuscole e accenti', () => {
    const merged = mergeResults([
      [makePassword(1, 'zeta'), makePassword(2, 'Àncora')],
      [makePassword(3, 'banca'), makePassword(4, 'Alfa')],
    ]);

    expect(merged.map((item) => item.nomePassword)).toEqual(['Alfa', 'Àncora', 'banca', 'zeta']);
  });

  it('a parità di nome ordina per id', () => {
    const merged = mergeResults([[makePassword(9, 'Gmail'), makePassword(4, 'gmail')]]);

    expect(merged.map((item) => item.id)).toEqual([4, 9]);
  });

  it('con elenchi vuoti restituisce un elenco vuoto', () => {
    expect(mergeResults([])).toEqual([]);
    expect(mergeResults([[], []])).toEqual([]);
  });

  it('non modifica gli elenchi ricevuti', () => {
    const list = [makePassword(2, 'B'), makePassword(1, 'A')];

    mergeResults([list]);

    expect(list.map((item) => item.id)).toEqual([2, 1]);
  });
});

describe('byName', () => {
  it('confronta i nomi alla maniera italiana', () => {
    expect(byName(makePassword(1, 'Alfa'), makePassword(2, 'beta'))).toBeLessThan(0);
    expect(byName(makePassword(1, 'beta'), makePassword(2, 'Alfa'))).toBeGreaterThan(0);
  });
});
