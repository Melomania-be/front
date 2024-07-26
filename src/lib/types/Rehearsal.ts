import type { GenericDataType } from './GenericDataType';
import type { Participant } from './Participant';

export interface Rehearsal {
	id: number | null;
	date: Date;
	comment: string | null;
	place: string;
	project_id: number | null;
	participants?: Participant[];
}
