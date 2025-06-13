import type { Answer } from './Answer';
import type { Concert } from './Concert';
import type { Contact } from './Contact';
import type { Project } from './Project';
import type { Rehearsal } from './Rehearsal';
import type { Section } from './Section';
import { Audition } from '$lib/types/Audition';

export interface Participant {
	id: number;
	accepted: boolean;
	answers: Array<Answer>;
	project: Project;
	section: Section;
	contact: Contact;
	lastActivity: Date;
	isSectionLeader: boolean;
	contactId: number;
	projectId: number;
	sectionId: number;
	updatedAt: Date;
	createdAt: Date;
	concerts?: Array<Concert>;
	rehearsals?: Array<Rehearsal>;
	pivot_comment?: string;
	audition_status?: 'none' | 'pending' | 'completed';
	audition_requested_at?: Date | null;
	audition_deadline?: Date | null;
	auditions?: Audition[];

}


