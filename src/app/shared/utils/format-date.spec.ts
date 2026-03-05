import { formatDateFr } from './format-date';

describe('formatDateFr', () => {
  it('should format a valid ISO date string in fr-FR locale', () => {
    const result = formatDateFr('2024-06-15T10:00:00Z');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/juin/);
    expect(result).toMatch(/2024/);
  });

  it('should return em-dash for null', () => {
    expect(formatDateFr(null)).toBe('—');
  });

  it('should return em-dash for undefined', () => {
    expect(formatDateFr(undefined)).toBe('—');
  });

  it('should return em-dash for empty string', () => {
    expect(formatDateFr('')).toBe('—');
  });

  it('should return em-dash for invalid date string', () => {
    expect(formatDateFr('not-a-date')).toBe('—');
  });
});
