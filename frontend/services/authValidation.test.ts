import { describe, expect, it } from 'vitest';
import { AUTH_RULES, validateAuthInput } from './authValidation';

describe('auth validation', () => {
  it('rejects short password', () => {
    const error = validateAuthInput({ username: 'root', password: 'root' });
    expect(error).toBe(`密码至少 ${AUTH_RULES.password.minLength} 个字符`);
  });

  it('rejects short username', () => {
    const error = validateAuthInput({ username: 'ab', password: 'safe-pass-123' });
    expect(error).toBe(`用户名至少 ${AUTH_RULES.username.minLength} 个字符`);
  });

  it('accepts valid input', () => {
    const error = validateAuthInput({ username: 'travel_user', password: 'safe-pass-123' });
    expect(error).toBeNull();
  });
});
