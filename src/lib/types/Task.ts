export interface Task {
	id: number;
	title: string;
	description: string | null;
	status: 'todo' | 'in_progress' | 'done';
	projectId: number;
	assignedTo: number | null;
	createdBy: number;
	assignedUser?: {
		id: number;
		firstName: string;
		lastName: string;
		email: string;
	};
	createdAt: Date;
	updatedAt: Date;
}