import type { GenericDataType } from './GenericDataType';

export interface Instrument {
	pivot_proficiency_level: string;
	id: number | null;
	name: string;
	family: string;
	createdAt: Date | null;
	updatedAt: Date | null;
}
