import type { GenericDataType } from './GenericDataType';
import type { Instrument } from './Instrument';
import type { Participant } from './Participant';

export interface Contact  {
	id: number | null;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	messenger: string;
	comments: string;
	validated: boolean;
	instruments: Array<Instrument>;
	participant: Array<Participant>;
	recommendation_pending: Boolean;
	createdAt: Date;
	updatedAt: Date;
}
