import type { Answer } from './Answer';
import type { Project } from './Project';
import type { Section } from './Section';

export interface Participant {
	id: number;
	accepted: boolean;
	answer: Array<Answer>;
	project: Project;
	section: Section;
	lastActivity: Date;
	contactId: number;
	projectId: number;
	sectionId: number;
	updatedAt: Date;
	createdAt: Date;
}
