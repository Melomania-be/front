import type { Instrument } from "./Instrument";

export interface Recommended  {
	id: number | null;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	messenger: string;
	instruments: Array<Instrument>;
	comment: String;
	project_id: Number;
	createdAt: Date;
	updatedAt: Date;
}