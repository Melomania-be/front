import type { File } from './File';

export interface Folder {
	id: number;
	name: string;
	files: File[];
	createdAt: string;
	updatedAt: string;
}
