/** Iniziale maiuscola per i monogrammi. Gestisce anche i caratteri fuori dal piano base. */
export function firstLetter(text: string): string {
  const first = Array.from(text.trim())[0];
  return first ? first.toLocaleUpperCase('it') : '?';
}
