import { getAgentTypeLabel, agentTypeLabels, getAgentDisplayName } from './agent-labels';

describe('agent-labels', () => {
  describe('agentTypeLabels', () => {
    it('should have expected keys', () => {
      expect(agentTypeLabels['energy_performance_advisor']).toBe('Conseiller en performance énergétique');
      expect(agentTypeLabels['other']).toBe('Autre');
    });
  });

  describe('getAgentTypeLabel', () => {
    it('should return mapped label for known types', () => {
      expect(getAgentTypeLabel('energy_performance_advisor')).toBe('Conseiller en performance énergétique');
      expect(getAgentTypeLabel('other')).toBe('Autre');
    });

    it('should return raw type for unknown types', () => {
      expect(getAgentTypeLabel('unknown_type')).toBe('unknown_type');
      expect(getAgentTypeLabel('foo')).toBe('foo');
    });
  });

  describe('getAgentDisplayName', () => {
    it('should return last name first when both parts exist', () => {
      expect(getAgentDisplayName({ first_name: 'Jean', last_name: 'Dupont' })).toBe('Dupont Jean');
    });

    it('should return first name only when last name is null', () => {
      expect(getAgentDisplayName({ first_name: 'Jean', last_name: null })).toBe('Jean');
    });

    it('should return dash when both names are empty', () => {
      expect(getAgentDisplayName({ first_name: null, last_name: null })).toBe('—');
    });

    it('should return empty string for null agent', () => {
      expect(getAgentDisplayName(null)).toBe('');
    });
  });
});
