import { describe, expect, it } from 'vitest';
import {
  isAllowedLocalBrowserRequest,
  isAllowedLocalOrigin,
  isLoopbackHost,
  normalizeLocalVoicevoxBaseUrl,
  parseAllowedLocalOrigins
} from '../src/security';

describe('localhost-only security helpers', () => {
  it('accepts only loopback host names', () => {
    expect(isLoopbackHost('localhost')).toBe(true);
    expect(isLoopbackHost('127.0.0.1')).toBe(true);
    expect(isLoopbackHost('[::1]')).toBe(true);
    expect(isLoopbackHost('0.0.0.0')).toBe(false);
    expect(isLoopbackHost('192.168.1.10')).toBe(false);
    expect(isLoopbackHost('example.test')).toBe(false);
  });

  it('keeps CORS origins on explicitly configured loopback origins', () => {
    const origins = parseAllowedLocalOrigins('http://127.0.0.1:5173,http://example.test:5173,https://localhost:5173');
    expect(origins).toEqual(['http://127.0.0.1:5173']);
    expect(isAllowedLocalOrigin('http://127.0.0.1:5173', origins)).toBe(true);
    expect(isAllowedLocalOrigin('http://localhost:5173', origins)).toBe(false);
    expect(isAllowedLocalOrigin('http://example.test:5173', origins)).toBe(false);
    expect(isAllowedLocalOrigin(undefined, origins)).toBe(false);
  });

  it('accepts same-origin browser fetch metadata when a GET omits Origin', () => {
    const origins = ['http://127.0.0.1:5173'];
    expect(isAllowedLocalBrowserRequest(undefined, 'same-origin', origins)).toBe(true);
    expect(isAllowedLocalBrowserRequest(undefined, 'cross-site', origins)).toBe(false);
    expect(isAllowedLocalBrowserRequest(undefined, undefined, origins)).toBe(false);
    expect(isAllowedLocalBrowserRequest('http://127.0.0.1:5173', 'same-origin', origins)).toBe(true);
    expect(isAllowedLocalBrowserRequest('http://127.0.0.1:5173', 'cross-site', origins)).toBe(false);
    expect(isAllowedLocalBrowserRequest('http://example.test:5173', 'same-origin', origins)).toBe(false);
  });

  it('accepts only the local VOICEVOX engine URL', () => {
    expect(normalizeLocalVoicevoxBaseUrl('http://localhost:50021/')).toBe('http://localhost:50021');
    expect(normalizeLocalVoicevoxBaseUrl('http://127.0.0.1:50021')).toBe('http://127.0.0.1:50021');
    expect(normalizeLocalVoicevoxBaseUrl('http://[::1]:50021')).toBe('http://[::1]:50021');
    expect(normalizeLocalVoicevoxBaseUrl('https://localhost:50021')).toBeUndefined();
    expect(normalizeLocalVoicevoxBaseUrl('http://localhost:50022')).toBeUndefined();
    expect(normalizeLocalVoicevoxBaseUrl('http://example.test:50021')).toBeUndefined();
    expect(normalizeLocalVoicevoxBaseUrl('http://user@localhost:50021')).toBeUndefined();
    expect(normalizeLocalVoicevoxBaseUrl('http://localhost:50021/path')).toBeUndefined();
  });
});
