import { ProjectSyncService } from '$lib/services/ProjectSyncService';

/**
 * Hook à utiliser lors des modifications de projet pour synchroniser automatiquement
 * les dossiers de fichiers
 */
export function useProjectModification() {
	/**
	 * À appeler après la création d'un projet
	 */
	const afterProjectCreation = async (projectId: number) => {
		try {
			await ProjectSyncService.initializeProjectStructure(projectId);
			console.log('Project structure initialized for project:', projectId);
		} catch (error) {
			console.error('Failed to initialize project structure:', error);
		}
	};

	/**
	 * À appeler après la modification des pièces d'un projet
	 */
	const afterPiecesModification = async (projectId: number) => {
		try {
			await ProjectSyncService.syncProjectPieces(projectId);
			console.log('Project pieces synchronized for project:', projectId);
		} catch (error) {
			console.error('Failed to sync project pieces:', error);
		}
	};

	/**
	 * À appeler lors de la sauvegarde d'un projet
	 */
	const onProjectSave = async (projectData: any) => {
		if (projectData.id) {
			// Projet existant - synchroniser les pièces
			await afterPiecesModification(projectData.id);
		} else {
			// Nouveau projet - initialiser la structure
			// Note: l'ID sera disponible après la création
			console.log('New project will be initialized after creation');
		}
	};

	return {
		afterProjectCreation,
		afterPiecesModification,
		onProjectSave
	};
}
