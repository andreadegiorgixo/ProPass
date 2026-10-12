import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  combineLatest,
  debounce,
  distinctUntilChanged,
  forkJoin,
  map,
  merge,
  of,
  startWith,
  switchMap,
  tap,
  timer,
} from 'rxjs';

import { errorMessage } from '../../core/api/api-error';
import { PasswordDto, PasswordInput } from '../../core/api/models';
import { PasswordApi } from '../../core/api/password-api';
import { byName, mergeResults } from './search-merge';

export type SearchFilter = 'tutto' | 'nome' | 'username' | 'link';
export type VaultView = 'loading' | 'error' | 'empty' | 'no-results' | 'list';

/** Pausa di scrittura prima di interrogare il backend. */
export const SEARCH_DEBOUNCE_MS = 300;

interface SearchRequest {
  term: string;
  filter: SearchFilter;
}

interface SearchOutcome {
  request: SearchRequest;
  items: PasswordDto[] | null;
  error: string | null;
}

/**
 * Unico punto da cui i componenti leggono e modificano le password.
 *
 * Tutto passa da qui di proposito: oggi il backend restituisce le password così come sono; se in
 * futuro si aggiungerà la cifratura lato client, basterà cambiare questo servizio.
 */
@Injectable()
export class VaultService {
  private readonly api = inject(PasswordApi);

  // Testo digitato (con pausa o subito) e filtro scelto.
  private readonly typed$ = new Subject<{ term: string; immediate: boolean }>();
  private readonly filter$ = new BehaviorSubject<SearchFilter>('tutto');
  private readonly reload$ = new Subject<void>();
  private current: SearchRequest = { term: '', filter: 'tutto' };

  /** Testo nel campo di ricerca, aggiornato a ogni tasto. */
  readonly query = signal('');
  readonly filter = signal<SearchFilter>('tutto');

  /** Risultati mostrati e testo a cui si riferiscono (può essere indietro rispetto a `query`). */
  readonly items = signal<PasswordDto[]>([]);
  readonly term = signal('');

  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  /** Una richiesta è in corso mentre l'elenco precedente è ancora a schermo. */
  readonly busy = signal(false);
  readonly errorMessage = signal<string | null>(null);
  /** Numero di password nel vault; null finché non è stato caricato l'elenco completo. */
  readonly total = signal<number | null>(null);

  readonly view = computed<VaultView>(() => {
    switch (this.status()) {
      case 'loading':
        return 'loading';
      case 'error':
        return 'error';
      default:
        if (this.items().length > 0) {
          return 'list';
        }
        return this.term() === '' ? 'empty' : 'no-results';
    }
  });

  constructor() {
    // Testo: dopo 300 ms di pausa, tranne quando lo si svuota (subito). Spazi ai bordi ignorati.
    const term$ = this.typed$.pipe(
      debounce(({ immediate }) => (immediate ? of(0) : timer(SEARCH_DEBOUNCE_MS))),
      map(({ term }) => term.trim()),
      startWith(''),
      distinctUntilChanged(),
    );

    // Il filtro conta solo se c'è del testo: senza testo si carica sempre l'elenco completo.
    const request$ = combineLatest([term$, this.filter$]).pipe(
      map(([term, filter]): SearchRequest => ({ term, filter: term === '' ? 'tutto' : filter })),
      distinctUntilChanged((a, b) => a.term === b.term && a.filter === b.filter),
    );

    merge(
      request$.pipe(tap((request) => (this.current = request))),
      this.reload$.pipe(map(() => this.current)),
    )
      .pipe(
        tap(() => this.begin()),
        // switchMap annulla la richiesta in corso quando ne parte una nuova.
        switchMap((request) =>
          this.fetch(request).pipe(
            map((items): SearchOutcome => ({ request, items, error: null })),
            catchError((error: unknown) =>
              of<SearchOutcome>({
                request,
                items: null,
                error: errorMessage(error, 'Non riusciamo a caricare le tue password.'),
              }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((outcome) => this.apply(outcome));
  }

  // ---------------------------------------------------------------- ricerca

  setQuery(text: string): void {
    this.query.set(text);
    this.typed$.next({ term: text, immediate: false });
  }

  clearQuery(): void {
    this.query.set('');
    this.typed$.next({ term: '', immediate: true });
  }

  setFilter(filter: SearchFilter): void {
    this.filter.set(filter);
    this.filter$.next(filter);
  }

  /** Ripete la richiesta corrente (dopo una modifica o con "Riprova"). */
  reload(): void {
    this.reload$.next();
  }

  // ---------------------------------------------------------------- modifiche

  // Dopo il salvataggio la riga si aggiorna subito con ciò che il server ha restituito; l'elenco
  // viene poi ricaricato per riallinearsi. Così alla chiusura del pannello non c'è un elenco vecchio.

  create(input: PasswordInput): Observable<PasswordDto> {
    return this.api.create(input).pipe(
      tap((created) => {
        // Durante una ricerca la nuova password potrebbe non corrispondere: decide il ricaricamento.
        if (this.term() === '') {
          this.items.update((list) => [...list, created].sort(byName));
        }
        this.afterChange(1);
      }),
    );
  }

  update(id: number, input: PasswordInput): Observable<PasswordDto> {
    return this.api.update(id, input).pipe(
      tap((updated) => {
        this.items.update((list) =>
          list.map((item) => (item.id === id ? updated : item)).sort(byName),
        );
        this.afterChange(0);
      }),
    );
  }

  remove(id: number): Observable<void> {
    return this.api.remove(id).pipe(
      tap(() => {
        this.items.update((list) => list.filter((item) => item.id !== id));
        this.afterChange(-1);
      }),
    );
  }

  // ---------------------------------------------------------------- interno

  private fetch(request: SearchRequest): Observable<PasswordDto[]> {
    const { term, filter } = request;

    if (term === '') {
      return this.api.list().pipe(map((list) => [...list].sort(byName)));
    }

    switch (filter) {
      case 'nome':
        return this.api.searchByNome(term).pipe(map((list) => [...list].sort(byName)));
      case 'username':
        return this.api.searchByUsername(term).pipe(map((list) => [...list].sort(byName)));
      case 'link':
        return this.api.searchByLink(term).pipe(map((list) => [...list].sort(byName)));
      default:
        // "Tutto": i tre endpoint insieme, risultati uniti senza duplicati.
        return forkJoin([
          this.api.searchByNome(term),
          this.api.searchByUsername(term),
          this.api.searchByLink(term),
        ]).pipe(map(mergeResults));
    }
  }

  private begin(): void {
    this.busy.set(true);
    // Lo scheletro serve solo al primo caricamento o dopo un errore; poi l'elenco resta a schermo.
    if (this.status() === 'error') {
      this.status.set('loading');
    }
  }

  private apply({ request, items, error }: SearchOutcome): void {
    this.busy.set(false);

    if (items === null) {
      this.status.set('error');
      this.errorMessage.set(error);
      return;
    }

    this.items.set(items);
    this.term.set(request.term);
    this.status.set('ready');
    this.errorMessage.set(null);
    if (request.term === '') {
      this.total.set(items.length);
    }
  }

  private afterChange(delta: number): void {
    if (delta !== 0) {
      this.total.update((count) => (count === null ? count : Math.max(0, count + delta)));
    }
    this.reload();
  }
}
