import type { Form } from './Form';
import type { GenericDataType } from './GenericDataType';

export interface Answer {
	text: string | boolean;
	formId: number;
	form?: Form
}
