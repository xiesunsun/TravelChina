export const AUTH_RULES = {
  username: { minLength: 3, maxLength: 50 },
  password: { minLength: 6, maxLength: 128 },
} as const;

export interface AuthInput {
  username: string;
  password: string;
}

export const validateAuthInput = ({ username, password }: AuthInput): string | null => {
  if (!username || !password) {
    return '请输入用户名和密码';
  }

  if (username.length < AUTH_RULES.username.minLength) {
    return `用户名至少 ${AUTH_RULES.username.minLength} 个字符`;
  }

  if (username.length > AUTH_RULES.username.maxLength) {
    return `用户名最多 ${AUTH_RULES.username.maxLength} 个字符`;
  }

  if (password.length < AUTH_RULES.password.minLength) {
    return `密码至少 ${AUTH_RULES.password.minLength} 个字符`;
  }

  if (password.length > AUTH_RULES.password.maxLength) {
    return `密码最多 ${AUTH_RULES.password.maxLength} 个字符`;
  }

  return null;
};
