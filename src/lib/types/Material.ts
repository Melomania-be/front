// src/lib/types/Material.ts
import type { File } from './File';
import type { Piece } from './Piece';

export interface Material {
	id: number;
	piece_id: number;
	name: string;
	description: string | null;
	edition: string | null;
	editor: string | null;
	notes: string | null;
	is_default: boolean;
	is_active: boolean;
	files_count: number;
	projects_count: number;
	createdAt: Date | string;
	updatedAt: Date | string;

	// Relations
	piece?: Piece;
	files?: File[];
}