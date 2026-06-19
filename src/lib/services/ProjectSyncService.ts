/**
 * Service pour synchroniser les dossiers de pièces lors des modifications de projet
 */
export class ProjectSyncService {
	/**
	 * Synchronise les dossiers de pièces après modification d'un projet
	 */
	static async syncProjectPieces(projectId: number): Promise<void> {
		try {
			const response = await fetch(`/api/filesystem/projects/${projectId}/sync-pieces`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error('Failed to sync project pieces');
			}

			console.log('Project pieces synchronized successfully');
		} catch (error) {
			console.error('Error syncing project pieces:', error);
			throw error;
		}
	}

	/**
	 * Initialise la structure de fichiers d'un projet
	 */
	static async initializeProjectStructure(projectId: number): Promise<any> {
		try {
			const response = await fetch(`/api/filesystem/projects/${projectId}/init`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error('Failed to initialize project structure');
			}

			return await response.json();
		} catch (error) {
			console.error('Error initializing project structure:', error);
			throw error;
		}
	}

	/**
	 * Copie les partitions d'une pièce vers un nouveau projet
	 */
	static async copyPieceScores(
		pieceId: number,
		fromProjectId: number,
		toProjectId: number
	): Promise<void> {
		try {
			const response = await fetch(`/api/filesystem/pieces/${pieceId}/copy-scores`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					fromProjectId,
					toProjectId
				})
			});

			if (!response.ok) {
				throw new Error('Failed to copy piece scores');
			}

			console.log('Piece scores copied successfully');
		} catch (error) {
			console.error('Error copying piece scores:', error);
			throw error;
		}
	}
}

/**
 * Hook pour synchroniser automatiquement les projets
 */
export function useProjectSync() {
	const syncAfterPieceChange = async (projectId: number) => {
		await ProjectSyncService.syncProjectPieces(projectId);
	};

	const initializeProject = async (projectId: number) => {
		return await ProjectSyncService.initializeProjectStructure(projectId);
	};

	return {
		syncAfterPieceChange,
		initializeProject
	};
}
