import type { GenericDataType } from './GenericDataType';

export interface ContentRegistration {
	id: number | null;
	title: string;
	text: string;
	registration_id: number;
	createdAt: Date;
	updatedAt: Date;
}
