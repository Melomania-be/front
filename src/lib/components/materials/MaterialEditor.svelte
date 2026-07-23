<!-- src/lib/components/materials/MaterialEditor.svelte - Version améliorée -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { X, Save, Copy } from 'lucide-svelte';

	// Correction 1 : Séparation des imports de types selon l'architecture de ton projet
	import type { Material } from '$lib/types/Material';
	// Si Piece n'a pas son propre fichier, tu peux utiliser `any` temporairement,
	// mais normalement c'est : import type { Piece } from '$lib/types/Piece';
	import type { Piece } from '$lib/types/Piece';

	import Button from '$lib/components/Button.svelte';

	const dispatch = createEventDispatcher();

	export let piece: Piece | null = null; // Peut être null pour création globale
	export let pieces: Piece[] = []; // Liste des pièces disponibles
	export let editMode: 'create' | 'edit' | 'duplicate' = 'create';
	export let material: Material | null = null;

	let formData = {
		name: '',
		description: '',
		edition: '',
		editor: '',
		notes: '',
		is_default: false,
		duplicateFiles: false,
		piece_id: piece?.id || null
	};

	let isSubmitting = false;
	let errors: Record<string, string> = {};

	// Initialiser le formulaire selon le mode
	$: if (material || editMode === 'create') {
		initializeForm();
	}

	function initializeForm() {
		if (editMode === 'edit' && material) {
			formData = {
				name: material.name || '',
				description: material.description || '',
				edition: material.edition || '',
				editor: material.editor || '',
				notes: material.notes || '',
				is_default: material.is_default || false,
				duplicateFiles: false,
				piece_id: material.piece_id
			};
		} else if (editMode === 'duplicate' && material) {
			formData = {
				name: `${material.name} (copie)`,
				description: `Copie de "${material.name}"`,
				edition: material.edition || '',
				editor: material.editor || '',
				notes: material.notes || '',
				is_default: false,
				duplicateFiles: false,
				piece_id: material.piece_id
			};
		} else if (editMode === 'create') {
			formData = {
				name: '',
				description: '',
				edition: '',
				editor: '',
				notes: '',
				is_default: false,
				duplicateFiles: false,
				piece_id: piece?.id || null
			};
		}
	}

	async function handleSubmit() {
		if (isSubmitting) return;

		isSubmitting = true;
		errors = {};

		// Validation côté client
		if (!formData.name.trim()) {
			errors.name = 'Le nom du matériel est requis';
			isSubmitting = false;
			return;
		}

		if (!formData.piece_id) {
			errors.piece_id = 'Vous devez sélectionner une pièce';
			isSubmitting = false;
			return;
		}

		try {
			let response: Response;
			let body: any = { ...formData };

			if (editMode === 'create') {
				response = await fetch('/api/materials', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body)
				});
			} else if (editMode === 'edit' && material) {
				delete body.duplicateFiles;
				response = await fetch(`/api/materials/${material.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body)
				});
			} else if (editMode === 'duplicate' && material) {
				response = await fetch(`/api/materials/${material.id}/duplicate`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: formData.name,
						description: formData.description,
						edition: formData.edition,
						editor: formData.editor,
						notes: formData.notes,
						duplicateFiles: formData.duplicateFiles
					})
				});
			} else {
				throw new Error('Mode d\'édition invalide');
			}

			if (response.ok) {
				const result = await response.json();
				dispatch('saved', result);
			} else {
				const error = await response.json();
				if (error.details) {
					// Correction 2 et 3 : Typage explicite pour .reduce()
					errors = error.details.reduce((acc: Record<string, string>, detail: { field: string, message: string }) => {
						acc[detail.field] = detail.message;
						return acc;
					}, {} as Record<string, string>);
				} else {
					errors.general = error.message || 'Une erreur est survenue';
				}
			}
		} catch (error) {
			console.error('Error saving material:', error);
			errors.general = 'Erreur de connexion';
		}

		isSubmitting = false;
	}

	function handleCancel() {
		dispatch('cancelled');
	}

	function getTitle(): string {
		switch (editMode) {
			case 'create':
				return 'Nouveau matériel';
			case 'edit':
				return 'Modifier le matériel';
			case 'duplicate':
				return 'Dupliquer le matériel';
			default:
				return 'Matériel';
		}
	}

	function getSelectedPiece(): Piece | null {
		if (!formData.piece_id) return null;
		return pieces.find(p => p.id === formData.piece_id) || null;
	}
</script>