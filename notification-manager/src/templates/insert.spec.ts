import { insertAtSelection } from './insert';

describe('insertAtSelection', () => {
  it('inserts at the cursor', () => {
    expect(insertAtSelection('Hello !', 6, 6, '{{name}}')).toEqual({
      value: 'Hello {{name}}!',
      cursor: 14,
    });
  });

  it('replaces the selected text', () => {
    expect(insertAtSelection('Hello XXX!', 6, 9, '{{name}}').value).toBe(
      'Hello {{name}}!'
    );
  });

  it('appends when there is no selection yet, and clamps stale positions', () => {
    expect(insertAtSelection('abc', null, null, 'X').value).toBe('abcX');
    expect(insertAtSelection('abc', 99, 120, 'X').value).toBe('abcX');
  });
});
