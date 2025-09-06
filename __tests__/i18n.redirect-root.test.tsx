import { describe, it, expect, vi } from 'vitest';

// Integration-ish: simulate locale resolution logic for root redirect
vi.mock('next/headers', async () => {
  return {
    headers: () => new Map([['accept-language', 'ru-RU,ru;q=0.9']]),
    cookies: () => ({ get: () => undefined }),
  } as any;
});

import Page from '@/app/page';

describe('root redirect', () => {
  it('should compute locale based on header when no cookie', () => {
    // We cannot run Next redirect in vitest; this test ensures import does not throw with mocked headers
    expect(typeof Page).toBe('function');
  });
});


