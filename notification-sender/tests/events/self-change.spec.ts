import { isSelfCreated } from '../../src/events/self-change';
import { baseMessage } from '../helpers';

describe('isSelfCreated', () => {
  const original = process.env.CTP_CLIENT_ID;
  beforeEach(() => {
    process.env.CTP_CLIENT_ID = 'connector-client';
  });
  afterAll(() => {
    process.env.CTP_CLIENT_ID = original;
  });

  it('is true when the connector client made the change', () => {
    const message = baseMessage({ createdBy: { clientId: 'connector-client' } }) as never;
    expect(isSelfCreated(message)).toBe(true);
  });

  it('is false for changes made by another client', () => {
    expect(isSelfCreated(baseMessage() as never)).toBe(false);
  });

  it('is false when the connector client id is not configured', () => {
    delete process.env.CTP_CLIENT_ID;
    const message = baseMessage({ createdBy: { clientId: '' } }) as never;
    expect(isSelfCreated(message)).toBe(false);
  });
});
