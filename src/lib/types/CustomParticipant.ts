import type { Answer } from './Answer';
import type { Concert } from './Concert';
import type { Contact } from './Contact';
import type { Project } from './Project';
import type { Rehearsal } from './Rehearsal';
import type { Section } from './Section';

export interface CustomParticipant {
	id: number | null;
	answers: Array<Answer>;
	project: Project;
	rehearsals: Array<Rehearsal>;
	concerts: Array<Concert>;
	section: Section | null;
	contact: Contact | null;
}
