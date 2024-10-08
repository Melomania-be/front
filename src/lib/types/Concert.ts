import type { Participant } from './Participant';

export interface Concert {
	id: number | null;
	startDate: Date;
	endDate: Date | null;
	comment: string | null;
	project_id: number | null;
	place: string;
	participants?: Participant[];
	pivot_comment?: string
}
