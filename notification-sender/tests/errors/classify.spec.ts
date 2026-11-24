import { classifyError } from '../../src/errors/classify';

describe('classifyError', () => {
  it.each([
    ['network error without status', new Error('socket hang up'), 'transient'],
    ['HTTP 429', { statusCode: 429 }, 'transient'],
    ['HTTP 503', { statusCode: 503 }, 'transient'],
    ['SDK error body with 500', { body: { statusCode: 500 } }, 'transient'],
    ['HTTP 404', { statusCode: 404 }, 'permanent'],
    ['HTTP 400', { statusCode: 400 }, 'permanent'],
    ['HTTP 401', { status: 401 }, 'permanent'],
  ])('%s is %s', (_label, error, expected) => {
    expect(classifyError(error)).toBe(expected);
  });
});
