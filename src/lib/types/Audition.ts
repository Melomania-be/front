// src/lib/types/Audition.ts
export interface Audition {
	id: number;
	participant_id: number;
	project_id: number;
	secure_token: string;
	instructions: string;
	required_files: string[];
	deadline: Date | null;
	is_submitted: boolean;
	submitted_at: Date | null;
	candidate_notes: string;
	participant?: {
		id: number;
		contact: {
			id: number;
			firstName: string;
			lastName: string;
			email: string;
			phone: string;
			messenger: string;
		};
		section: {
			id: number;
			name: string;
		};
	};
	project?: {
		id: number;
		name: string;
	};
	files?: AuditionFile[];
	createdAt: Date;
	updatedAt: Date;
}

export interface AuditionFile {
	id: number;
	audition_id: number;
	file_id: number;
	file_type: 'video' | 'audio' | 'pdf' | 'image' | 'other';
	description: string;
	uploaded_at: Date;
	file: {
		id: number;
		name: string;
		type: string;
		path: string;
	};
	createdAt: Date;
	updatedAt: Date;
}
