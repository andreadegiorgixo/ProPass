import { PasswordDto } from '../../core/api/models';

/** Ordine alfabetico per nome, senza distinguere maiuscole/minuscole né accenti; a parità, per id. */
export function byName(a: PasswordDto, b: PasswordDto): number {
  return a.nomePassword.localeCompare(b.nomePassword, 'it', { sensitivity: 'base' }) || a.id - b.id;
}

/** Unisce più elenchi di risultati senza duplicati (per id) e li ordina per nome. */
export function mergeResults(lists: readonly (readonly PasswordDto[])[]): PasswordDto[] {
  const byId = new Map<number, PasswordDto>();
  for (const list of lists) {
    for (const item of list) {
      if (!byId.has(item.id)) {
        byId.set(item.id, item);
      }
    }
  }
  return [...byId.values()].sort(byName);
}
