import type { Material } from './Material';

export interface FileSystemItem {
	id: number;
	name: string;
	type: 'file' | 'folder';
	path: string;
	size?: number;
	mimeType?: string;
	parentId?: number;
	projectId?: number;
	pieceId?: number;
	createdAt: Date;
	updatedAt: Date;
	children?: FileSystemItem[];
	isSystemGenerated?: boolean; // Pour les dossiers auto-créés
	materials?: Material[]; // ✅ AJOUT : Matériels associés à un dossier de pièce
}

export interface ProjectFileStructure {
	id: number;
	projectId: number;
	rootFolder: FileSystemItem;
	scoresFolder: FileSystemItem;
	photosFolder: FileSystemItem;
	videosFolder: FileSystemItem;
	documentsFolder: FileSystemItem;
	customFolders: FileSystemItem[];
}

export interface FileUploadRequest {
	files: FileList;
	parentId?: number;
	projectId?: number;
	pieceId?: number;
}

export interface BreadcrumbItem {
	id: number;
	name: string;
	path: string;
}
