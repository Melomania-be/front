import type { Answer } from './Answer';

export interface SubmittedContact {
	first_name: string;
	last_name: string;
	email: string;
	phone: string | null;
	messenger: string | null;
	validated_contact: boolean;
	section_id: number;
	answers: Answer[];
}
