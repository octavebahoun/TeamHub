import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { handshakeCredentials } from './auth.js';

describe('handshakeCredentials', () => {
  it('reads the httpOnly cookies sent by Next', () => {
    const creds = handshakeCredentials({
      headers: { cookie: 'wine_token=abc%2Fxyz; wine_org=4' },
      auth: {},
    });
    assert.equal(creds.token, 'abc/xyz');
    assert.equal(creds.organizationId, 4);
  });

  it('prefers an explicit token (scripts and tests)', () => {
    const creds = handshakeCredentials({
      headers: { cookie: 'wine_token=from-cookie' },
      auth: { token: 'from-auth', organization_id: 9 },
    });
    assert.equal(creds.token, 'from-auth');
    assert.equal(creds.organizationId, 9);
  });

  it('returns nothing when the handshake is empty', () => {
    const creds = handshakeCredentials({ headers: {}, auth: {} });
    assert.equal(creds.token, undefined);
    assert.equal(creds.organizationId, undefined);
  });
});
