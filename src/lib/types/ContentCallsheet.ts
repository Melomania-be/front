import type { GenericDataType } from './GenericDataType';

export interface ContentCallsheet {
	id: number | null;
	callsheet_id: number;
	title: string;
	text: string;
	updatedAt: Date;
	createdAt: Date;
	position: number;
}
