import type { GenericDataType } from './GenericDataType';
import type { Section } from './Section';

export interface SectionGroup {
	id: number | null;
	name: string;
	sections: Section[];
	updatedAt: Date | null;
}
