import type { ContentCallsheet } from './ContentCallsheet';
import type { Project } from './Project';

export interface Callsheet {
	id: number | null;
	version: string;
	projectId: number;
	contents: ContentCallsheet[];
	project: Project;
	updatedAt: Date;
	createdAt: Date;
}
