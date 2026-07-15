import type { GenericDataType } from './GenericDataType';

export interface ContentCallsheet {
	id: number | null;
	callsheet_id: number;
	title: string;
	text: string;
	order: number;
	position: 'above' | 'below';
	updatedAt: Date;
	createdAt: Date;
}