type ValidationItem = {
  type?: string;
  loc?: unknown;
  msg?: string;
  ctx?: {
    min_length?: number;
    max_length?: number;
  };
};

const AUTH_FIELD_LABELS: Record<string, string> = {
  username: '用户名',
  password: '密码',
};

const pickFieldFromLoc = (loc: unknown): string | null => {
  if (!Array.isArray(loc)) return null;
  const value = loc.find((entry) => typeof entry === 'string' && entry !== 'body');
  return typeof value === 'string' ? value : null;
};

const mapValidationItem = (item: ValidationItem): string | null => {
  const field = pickFieldFromLoc(item.loc);
  const label = field ? AUTH_FIELD_LABELS[field] ?? field : null;

  if (item.type === 'string_too_short' && typeof item.ctx?.min_length === 'number' && label) {
    return `${label}至少 ${item.ctx.min_length} 个字符`;
  }

  if (item.type === 'string_too_long' && typeof item.ctx?.max_length === 'number' && label) {
    return `${label}最多 ${item.ctx.max_length} 个字符`;
  }

  if (item.type === 'missing' && label) {
    return `${label}不能为空`;
  }

  if (typeof item.msg === 'string' && item.msg.trim()) {
    return label ? `${label}: ${item.msg.trim()}` : item.msg.trim();
  }

  return null;
};

export const extractApiErrorDetail = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null;
  const detail = (payload as { detail?: unknown }).detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim();
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item && typeof item === 'object' ? mapValidationItem(item as ValidationItem) : null))
      .filter((item): item is string => Boolean(item));
    if (messages.length > 0) {
      return messages.join('；');
    }
  }

  return null;
};
