import { components } from '@app/core/api/generated/api-types';

type SectionModelWithIndicators = components['schemas']['SectionModelWithIndicators'];

export type DisplaySection = Omit<SectionModelWithIndicators, 'id'> & { id: string | null };
