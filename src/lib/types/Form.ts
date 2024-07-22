import type { GenericDataType } from './GenericDataType';

export interface Form {
	id: number | null;
	text: string;
	type: string;
	registration_id: number;
}
