import type { Contact } from "./Contact";

export interface List  {
	id: number | null;
	name: string;
	contacts: Contact[];
    mailTemplate: any;
	createdAt: string;
	updatedAt: string;
};