import { urlOf } from './service-url';

describe('urlOf', () => {
  it('accepts https and http on localhost', () => {
    expect(urlOf({ url: 'https://s.example.com/templateApi' })).toBe(
      'https://s.example.com/templateApi'
    );
    expect(urlOf({ url: 'http://localhost:8080/templateApi' })).toBe(
      'http://localhost:8080/templateApi'
    );
    expect(urlOf({ url: 'http://127.0.0.1:8080/templateApi' })).toBeDefined();
  });

  it('rejects http on a remote host, junk and missing values', () => {
    expect(urlOf({ url: 'http://s.example.com' })).toBeUndefined();
    expect(urlOf({ url: 'localhost:8080' })).toBeUndefined();
    expect(urlOf({ url: 'ftp://localhost' })).toBeUndefined();
    expect(urlOf(undefined)).toBeUndefined();
    expect(urlOf({})).toBeUndefined();
  });
});
