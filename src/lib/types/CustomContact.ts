export interface CustomContact {
	id: number | null;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	messenger: string;
	comments: string;
	validated: boolean;
	instruments: string;
	recommendation_pending: Boolean;
	createdAt: Date;
	updatedAt: Date;
}
