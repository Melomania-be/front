import type { GenericDataType } from './GenericDataType';

export interface Rehearsal {
	id: number | null;
	date: string | Date;
	comment: string | null;
	place: string;
}
