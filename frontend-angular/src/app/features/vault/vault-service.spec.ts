import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';

import { PasswordDto } from '../../core/api/models';
import { PasswordApi } from '../../core/api/password-api';
import { makePassword } from '../../testing/fixtures';
import { SEARCH_DEBOUNCE_MS, VaultService } from './vault-service';

const GITHUB = makePassword(1, 'GitHub');
const GMAIL = makePassword(2, 'Gmail');
const BANCA = makePassword(3, 'Banca');

function createApi() {
  return {
    list: vi.fn<() => Observable<PasswordDto[]>>(),
    searchByNome: vi.fn<(term: string) => Observable<PasswordDto[]>>(),
    searchByUsername: vi.fn<(term: string) => Observable<PasswordDto[]>>(),
    searchByLink: vi.fn<(term: string) => Observable<PasswordDto[]>>(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };
}

describe('VaultService', () => {
  let api: ReturnType<typeof createApi>;

  beforeEach(() => {
    vi.useFakeTimers();
    api = createApi();
    api.list.mockReturnValue(of([GMAIL, BANCA, GITHUB]));
    api.searchByNome.mockReturnValue(of([]));
    api.searchByUsername.mockReturnValue(of([]));
    api.searchByLink.mockReturnValue(of([]));
    TestBed.configureTestingModule({
      providers: [VaultService, { provide: PasswordApi, useValue: api }],
    });
  });

  afterEach(() => vi.useRealTimers());

  const create = () => TestBed.inject(VaultService);
  const names = (service: VaultService) => service.items().map((item) => item.nomePassword);

  describe('caricamento iniziale', () => {
    it('carica l\'elenco completo, ordinato per nome, e ne ricorda il conteggio', () => {
      const service = create();

      expect(api.list).toHaveBeenCalledTimes(1);
      expect(names(service)).toEqual(['Banca', 'GitHub', 'Gmail']);
      expect(service.total()).toBe(3);
      expect(service.view()).toBe('list');
    });

    it('vault vuoto: vista "empty"', () => {
      api.list.mockReturnValue(of([]));
      const service = create();

      expect(service.view()).toBe('empty');
      expect(service.total()).toBe(0);
    });

    it('errore di caricamento: vista "error", poi "Riprova" lo recupera', () => {
      api.list.mockReturnValueOnce(throwError(() => new Error('boom')));
      const service = create();

      expect(service.view()).toBe('error');
      expect(service.errorMessage()).toBeTruthy();

      service.reload();

      expect(service.view()).toBe('list');
      expect(service.errorMessage()).toBeNull();
    });
  });

  describe('ricerca', () => {
    it('aspetta 300 ms di pausa e fa una sola richiesta per l\'ultimo testo', () => {
      const service = create();
      service.setFilter('nome');

      service.setQuery('g');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 100);
      service.setQuery('gi');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 100);
      service.setQuery('git');
      expect(api.searchByNome).not.toHaveBeenCalled();

      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

      expect(api.searchByNome).toHaveBeenCalledTimes(1);
      expect(api.searchByNome).toHaveBeenCalledWith('git');
    });

    it('ignora gli spazi ai bordi e non ripete la stessa ricerca', () => {
      const service = create();
      service.setFilter('nome');

      service.setQuery('git');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      service.setQuery('  git ');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

      expect(api.searchByNome).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['nome', 'searchByNome'],
      ['username', 'searchByUsername'],
      ['link', 'searchByLink'],
    ] as const)('filtro "%s": interroga solo %s', (filter, method) => {
      const service = create();
      service.setFilter(filter);

      service.setQuery('git');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

      for (const other of ['searchByNome', 'searchByUsername', 'searchByLink'] as const) {
        expect(api[other]).toHaveBeenCalledTimes(other === method ? 1 : 0);
      }
    });

    it('filtro "tutto": i tre endpoint, risultati uniti senza duplicati e ordinati', () => {
      api.searchByNome.mockReturnValue(of([GITHUB]));
      api.searchByUsername.mockReturnValue(of([GMAIL, GITHUB]));
      api.searchByLink.mockReturnValue(of([BANCA, GITHUB]));
      const service = create();

      service.setQuery('rossi');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

      expect(api.searchByNome).toHaveBeenCalledWith('rossi');
      expect(api.searchByUsername).toHaveBeenCalledWith('rossi');
      expect(api.searchByLink).toHaveBeenCalledWith('rossi');
      expect(names(service)).toEqual(['Banca', 'GitHub', 'Gmail']);
      expect(service.term()).toBe('rossi');
    });

    it('cambiare filtro con del testo ripete subito la ricerca, senza attese', () => {
      const service = create();
      service.setQuery('git');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      api.searchByLink.mockClear();

      service.setFilter('link');

      expect(api.searchByLink).toHaveBeenCalledTimes(1);
    });

    it('cambiare filtro a campo vuoto non fa richieste', () => {
      const service = create();
      api.list.mockClear();

      service.setFilter('username');

      expect(api.list).not.toHaveBeenCalled();
      expect(api.searchByUsername).not.toHaveBeenCalled();
    });

    it('svuotare il campo ricarica l\'elenco completo subito', () => {
      const service = create();
      service.setQuery('git');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      api.list.mockClear();

      service.clearQuery();

      expect(api.list).toHaveBeenCalledTimes(1);
      expect(service.query()).toBe('');
      expect(service.term()).toBe('');
    });

    it('un testo digitato prima dello svuotamento non riemerge dopo', () => {
      const service = create();
      service.setQuery('git');
      service.clearQuery();
      api.searchByNome.mockClear();
      api.searchByUsername.mockClear();
      api.searchByLink.mockClear();

      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2);

      expect(api.searchByNome).not.toHaveBeenCalled();
      expect(api.searchByUsername).not.toHaveBeenCalled();
      expect(api.searchByLink).not.toHaveBeenCalled();
    });

    it('nessun risultato: vista "no-results" con il testo cercato', () => {
      const service = create();

      service.setQuery('zzz');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

      expect(service.view()).toBe('no-results');
      expect(service.term()).toBe('zzz');
    });

    it('annulla la richiesta superata: la risposta in ritardo non sovrascrive quella nuova', () => {
      const slow = new Subject<PasswordDto[]>();
      api.searchByNome.mockReturnValueOnce(slow).mockReturnValueOnce(of([GMAIL]));
      const service = create();
      service.setFilter('nome');

      service.setQuery('g');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      service.setQuery('gm');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      expect(names(service)).toEqual(['Gmail']);

      slow.next([GITHUB]);

      expect(names(service)).toEqual(['Gmail']);
      expect(slow.observed).toBe(false);
    });

    it('il totale del vault non cambia mentre si cerca', () => {
      api.searchByNome.mockReturnValue(of([GITHUB]));
      const service = create();
      service.setFilter('nome');

      service.setQuery('git');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

      expect(service.items()).toHaveLength(1);
      expect(service.total()).toBe(3);
    });
  });

  describe('modifiche', () => {
    it('create: aggiorna il conteggio e ricarica l\'elenco', () => {
      const created = makePassword(4, 'Zeta');
      api.create.mockReturnValue(of(created));
      const service = create();
      api.list.mockReturnValue(of([GMAIL, BANCA, GITHUB, created]));

      service.create({ nomePassword: 'Zeta', password: 'x', link: 'zeta.it', username: 'u', note: null }).subscribe();

      expect(api.list).toHaveBeenCalledTimes(2);
      expect(service.total()).toBe(4);
      expect(names(service)).toEqual(['Banca', 'GitHub', 'Gmail', 'Zeta']);
    });

    it('create: la riga compare subito, senza aspettare il ricaricamento', () => {
      const created = makePassword(4, 'Zeta');
      api.create.mockReturnValue(of(created));
      const service = create();
      // Il ricaricamento resta in attesa: l'elenco deve già contenere la nuova password.
      api.list.mockReturnValue(new Subject<PasswordDto[]>());

      service.create({ nomePassword: 'Zeta', password: 'x', link: 'zeta.it', username: 'u', note: null }).subscribe();

      expect(names(service)).toEqual(['Banca', 'GitHub', 'Gmail', 'Zeta']);
      expect(service.busy()).toBe(true);
    });

    it('create durante una ricerca: non inserisce la riga, decide il ricaricamento', () => {
      const created = makePassword(4, 'Zeta');
      api.create.mockReturnValue(of(created));
      api.searchByNome.mockReturnValue(of([GITHUB]));
      const service = create();
      service.setFilter('nome');
      service.setQuery('git');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      api.searchByNome.mockReturnValue(new Subject<PasswordDto[]>());

      service.create({ nomePassword: 'Zeta', password: 'x', link: 'zeta.it', username: 'u', note: null }).subscribe();

      expect(names(service)).toEqual(['GitHub']);
    });

    it('update: la riga mostra subito il nuovo nome, nell\'ordine giusto', () => {
      const renamed = makePassword(GITHUB.id, 'Zeta');
      api.update.mockReturnValue(of(renamed));
      const service = create();
      api.list.mockReturnValue(new Subject<PasswordDto[]>());

      service.update(GITHUB.id, { nomePassword: 'Zeta', password: 'x', link: 'l', username: 'u', note: null }).subscribe();

      expect(names(service)).toEqual(['Banca', 'Gmail', 'Zeta']);
    });

    it('remove: toglie subito la riga e riduce il conteggio', () => {
      api.remove.mockReturnValue(of(undefined));
      const service = create();
      api.list.mockReturnValue(of([GMAIL, BANCA]));

      service.remove(GITHUB.id).subscribe();

      expect(api.remove).toHaveBeenCalledWith(GITHUB.id);
      expect(service.total()).toBe(2);
      expect(names(service)).toEqual(['Banca', 'Gmail']);
    });

    it('update: ricarica senza toccare il conteggio', () => {
      api.update.mockReturnValue(of(GITHUB));
      const service = create();
      api.list.mockClear();

      service.update(GITHUB.id, { nomePassword: 'GitHub', password: 'x', link: 'l', username: 'u', note: null }).subscribe();

      expect(api.list).toHaveBeenCalledTimes(1);
      expect(service.total()).toBe(3);
    });

    it('dopo una modifica durante una ricerca ripete la ricerca, non l\'elenco completo', () => {
      api.remove.mockReturnValue(of(undefined));
      api.searchByNome.mockReturnValue(of([GITHUB, GMAIL]));
      const service = create();
      service.setFilter('nome');
      service.setQuery('g');
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      api.list.mockClear();
      api.searchByNome.mockClear();
      api.searchByNome.mockReturnValue(of([GMAIL]));

      service.remove(GITHUB.id).subscribe();

      expect(api.list).not.toHaveBeenCalled();
      expect(api.searchByNome).toHaveBeenCalledWith('g');
      expect(names(service)).toEqual(['Gmail']);
      expect(service.total()).toBe(2);
    });
  });
});
