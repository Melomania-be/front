export interface Concert {
	id: number | null;
	date: string | Date;
	comment: string | null;
	project_id: number | null;
	place: string;
}
