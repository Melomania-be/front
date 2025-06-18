export type RecruitmentStatus =
	| 'awaiting response'
	| 'interested'
	| 'participating'
	| 'registered'
	| 'not available'
	| 'to be contacted'
	| 'cancelled'
	| 'other'
	| 'withdrawn';

export interface Recruitment {
	id: number;
	firstName: string;
	lastName: string;
	sectionGroupId: number;
	contactDate: string; // Changed from contact_date to contactDate to match backend model
	contactedBy: number;
	status: RecruitmentStatus;
	statusUpdatedAt: string; // ISO timestamp (e.g. '2025-06-16T12:34:56Z')
	comment?: string | null; // Optional and nullable
	createdAt: string; // Added to match backend
	updatedAt: string; // Added to match backend
}
