import { describe, expect, it } from 'vitest';
import { extractApiErrorDetail } from './apiError';

describe('api error parser', () => {
  it('returns string detail directly', () => {
    const detail = extractApiErrorDetail({ detail: 'Username already exists' });
    expect(detail).toBe('Username already exists');
  });

  it('parses fastapi validation array into readable message', () => {
    const detail = extractApiErrorDetail({
      detail: [
        {
          type: 'string_too_short',
          loc: ['body', 'password'],
          msg: 'String should have at least 6 characters',
          ctx: { min_length: 6 },
        },
      ],
    });

    expect(detail).toBe('密码至少 6 个字符');
  });

  it('falls back to null when payload is not recognized', () => {
    const detail = extractApiErrorDetail({ message: 'unknown' });
    expect(detail).toBeNull();
  });
});
