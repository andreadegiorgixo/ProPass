import { displayLink, safeHref } from './link';

describe('safeHref', () => {
  it('lascia passare http e https', () => {
    expect(safeHref('https://github.com/login')).toBe('https://github.com/login');
    expect(safeHref('http://example.com')).toBe('http://example.com/');
    expect(safeHref('HTTPS://EXAMPLE.COM')).toBe('https://example.com/');
  });

  it('tratta un link senza schema come https', () => {
    expect(safeHref('github.com')).toBe('https://github.com/');
    expect(safeHref('mail.google.com/mail/u/0')).toBe('https://mail.google.com/mail/u/0');
    expect(safeHref('localhost:8080/admin')).toBe('https://localhost:8080/admin');
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'mailto:mario@example.com',
    'file:///etc/passwd',
    'ftp://example.com/file',
  ])('non apre mai "%s"', (link) => {
    expect(safeHref(link)).toBeNull();
  });

  it('rifiuta testi vuoti o con spazi', () => {
    expect(safeHref('')).toBeNull();
    expect(safeHref('   ')).toBeNull();
    expect(safeHref('non è un link')).toBeNull();
  });
});

describe('displayLink', () => {
  it('toglie schema e "/" finale', () => {
    expect(displayLink('https://github.com/')).toBe('github.com');
    expect(displayLink('http://example.com/login')).toBe('example.com/login');
    expect(displayLink('  github.com  ')).toBe('github.com');
  });
});
