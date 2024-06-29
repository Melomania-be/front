import type { GenericDataType } from './GenericDataType';

export interface Rehearsal {
	id: number | null;
	date: string;
	comment: string | null;
	place: string;
}
