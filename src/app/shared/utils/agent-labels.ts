export const agentTypeLabels: Record<string, string> = {
  energy_performance_advisor: 'Conseiller en performance énergétique',
  other: 'Autre',
};

export function getAgentTypeLabel(type: string): string {
  return agentTypeLabels[type] ?? type;
}

export function getAgentDisplayName(agent: { first_name?: string | null; last_name?: string | null } | null): string {
  if (!agent) return '';
  return [agent.first_name, agent.last_name].filter(Boolean).join(' ') || '—';
}
