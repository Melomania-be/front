import type { ContentRegistration } from './ContentRegistration';
import type { Form } from './Form';
import type { GenericDataType } from './GenericDataType';
import type { Project } from './Project';

export interface Registration {
	id: number;
	project: Project | null;
	contents: ContentRegistration[];
	form: Form[];
	//status: boolean
}
