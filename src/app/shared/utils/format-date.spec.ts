import { formatDateFr } from './format-date';

describe('formatDateFr', () => {
  it('should format a valid ISO date string as dd/mm/yyyy hh:mm', () => {
    expect(formatDateFr('2024-06-15T10:30:00Z')).toBe('15/06/2024 10:30');
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
