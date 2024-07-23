import type { Answer } from './Answer';
import type { Concert } from './Concert';
import type { Contact } from './Contact';
import type { Project } from './Project';
import type { Rehearsal } from './Rehearsal';
import type { Section } from './Section';

export interface Participant {
	id: number;
	accepted: boolean;
	answers: Array<Answer>;
	project: Project;
	section: Section;
	contact: Contact;
	lastActivity: Date;
	contactId: number;
	projectId: number;
	sectionId: number;
	updatedAt: Date;
	createdAt: Date;
	concerts?: Array<Concert>;
	rehearsals?: Array<Rehearsal>;
}
