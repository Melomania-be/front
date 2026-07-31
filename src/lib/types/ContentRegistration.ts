import type { GenericDataType } from './GenericDataType';

export interface ContentRegistration {
	id: number | null;
	title: string;
	text: string;
	registration_id: number;
	order: number;
	position: 'above' | 'below';
	createdAt: Date;
	updatedAt: Date;
}