import type { Instrument } from './Instrument';
import type { Participant } from './Participant';
import type { Project } from './Project';

export interface Contact {
	id: number | null;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	messenger: string;
	comments: string;
	validated: boolean;
	instruments: Array<Instrument>;
	participants: Array<Participant>;
	projects: Array<Project>;
	recommendation_pending: Boolean;
	createdAt: Date;
	updatedAt: Date;
}
