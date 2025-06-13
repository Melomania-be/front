// src/lib/types/CreateAuditionRequest.ts
export interface CreateAuditionRequest {
	instructions?: string;
	required_files?: string[];
	deadline?: Date | null;
}

export interface SubmitAuditionRequest {
	notes?: string;
}

export interface UploadAuditionFileRequest {
	file: File;
	fileType: 'video' | 'audio' | 'pdf' | 'image' | 'other';
	description: string;
}