import type { Form } from './Form';
import type { GenericDataType } from './GenericDataType';

export interface Answer {
	text: string;
	formId: number;
	form?: Form;
}
