import type { Instrument } from "./Instrument";

export interface Recommended  {
	id: number | null;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	messenger: string;
	instruments: Array<Instrument>,
	createdAt: Date;
	updatedAt: Date;
}