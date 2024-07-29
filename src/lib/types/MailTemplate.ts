export interface MailTemplate {
	id: number | null;
	name: string;
	content: string;
	attachments: string[];
	createdAt: string;
	updatedAt: string;
}
