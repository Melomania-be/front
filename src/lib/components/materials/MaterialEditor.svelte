<!-- src/lib/components/materials/MaterialEditor.svelte - Version améliorée -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { X, Save, Copy, Music } from 'lucide-svelte';
	import type { Material, Piece } from '$lib/types';

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
				throw new Error("Mode d'édition invalide");
			}

			if (response.ok) {
				const result = await response.json();
				dispatch('saved', result);
			} else {
				const error = await response.json();
				if (error.details) {
					errors = error.details.reduce((acc, detail) => {
						acc[detail.field] = detail.message;
						return acc;
					}, {});
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
		return pieces.find((p) => p.id === formData.piece_id) || null;
	}
</script>

<!-- Modal -->
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
	<div class="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
		<!-- En-tête -->
		<div class="flex items-center justify-between p-6 border-b border-gray-200">
			<div>
				<h3 class="text-xl font-bold text-gray-800">{getTitle()}</h3>
				{#if getSelectedPiece()}
					<p class="text-sm text-gray-500 mt-1">
						{getSelectedPiece().name} - {getSelectedPiece().composer?.shortName ||
							getSelectedPiece().composer?.longName}
					</p>
				{/if}
			</div>
			<button
				class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
				on:click={handleCancel}
				disabled={isSubmitting}
			>
				<X size={20} />
			</button>
		</div>

		<!-- Contenu -->
		<div class="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
			{#if errors.general}
				<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
					<p class="text-sm text-red-600">{errors.general}</p>
				</div>
			{/if}

			<form on:submit|preventDefault={handleSubmit} class="space-y-6">
				<!-- Sélection de la pièce (si création globale) -->
				{#if editMode === 'create' && !piece}
					<div>
						<label for="piece_id" class="block text-sm font-medium text-gray-700 mb-2">
							Pièce associée *
						</label>
						<select
							id="piece_id"
							bind:value={formData.piece_id}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent transition-colors"
							required
							disabled={isSubmitting}
						>
							<option value={null}>Sélectionnez une pièce</option>
							{#each pieces as pieceOption}
								<option value={pieceOption.id}>
									{pieceOption.name} - {pieceOption.composer?.shortName ||
										pieceOption.composer?.longName}
									{#if pieceOption.opus}• Op. {pieceOption.opus}{/if}
								</option>
							{/each}
						</select>
						{#if errors.piece_id}
							<p class="text-sm text-red-600 mt-1">{errors.piece_id}</p>
						{/if}
					</div>
				{/if}

				<!-- Nom -->
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
						Nom du matériel *
					</label>
					<input
						id="name"
						type="text"
						bind:value={formData.name}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent transition-colors"
						placeholder="Ex: Matériel principal, Version concert, etc."
						required
						disabled={isSubmitting}
					/>
					{#if errors.name}
						<p class="text-sm text-red-600 mt-1">{errors.name}</p>
					{/if}
				</div>

				<!-- Description -->
				<div>
					<label for="description" class="block text-sm font-medium text-gray-700 mb-2">
						Description
					</label>
					<textarea
						id="description"
						bind:value={formData.description}
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent transition-colors resize-vertical"
						placeholder="Description du matériel, annotations particulières..."
						disabled={isSubmitting}
					></textarea>
					{#if errors.description}
						<p class="text-sm text-red-600 mt-1">{errors.description}</p>
					{/if}
				</div>

				<!-- Édition et Éditeur -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="edition" class="block text-sm font-medium text-gray-700 mb-2">
							Édition
						</label>
						<input
							id="edition"
							type="text"
							bind:value={formData.edition}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent transition-colors"
							placeholder="Ex: Urtext, Peters, etc."
							disabled={isSubmitting}
						/>
						{#if errors.edition}
							<p class="text-sm text-red-600 mt-1">{errors.edition}</p>
						{/if}
					</div>

					<div>
						<label for="editor" class="block text-sm font-medium text-gray-700 mb-2">
							Éditeur
						</label>
						<input
							id="editor"
							type="text"
							bind:value={formData.editor}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent transition-colors"
							placeholder="Nom de la maison d'édition"
							disabled={isSubmitting}
						/>
						{#if errors.editor}
							<p class="text-sm text-red-600 mt-1">{errors.editor}</p>
						{/if}
					</div>
				</div>

				<!-- Notes -->
				<div>
					<label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
						Notes supplémentaires
					</label>
					<textarea
						id="notes"
						bind:value={formData.notes}
						rows="4"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent transition-colors resize-vertical"
						placeholder="Coups d'archets, modifications, informations de performance..."
						disabled={isSubmitting}
					></textarea>
					{#if errors.notes}
						<p class="text-sm text-red-600 mt-1">{errors.notes}</p>
					{/if}
				</div>

				<!-- Options -->
				<div class="space-y-3">
					{#if editMode !== 'duplicate'}
						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={formData.is_default}
								class="w-4 h-4 text-[#6B9AD9] bg-gray-100 border-gray-300 rounded focus:ring-[#6B9AD9] focus:ring-2"
								disabled={isSubmitting}
							/>
							<span class="ml-2 text-sm text-gray-700">
								Définir comme matériel par défaut pour cette pièce
							</span>
						</label>
					{/if}

					{#if editMode === 'duplicate'}
						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={formData.duplicateFiles}
								class="w-4 h-4 text-[#6B9AD9] bg-gray-100 border-gray-300 rounded focus:ring-[#6B9AD9] focus:ring-2"
								disabled={isSubmitting}
							/>
							<span class="ml-2 text-sm text-gray-700"> Dupliquer également les fichiers </span>
						</label>
					{/if}
				</div>
			</form>
		</div>

		<!-- Pied de page -->
		<div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
			<button
				type="button"
				class="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
				on:click={handleCancel}
				disabled={isSubmitting}
			>
				Annuler
			</button>
			<button
				type="submit"
				class="flex items-center gap-2 px-6 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				on:click={handleSubmit}
				disabled={isSubmitting || !formData.name.trim() || !formData.piece_id}
			>
				{#if isSubmitting}
					<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
				{:else if editMode === 'duplicate'}
					<Copy size={16} />
				{:else}
					<Save size={16} />
				{/if}
				{editMode === 'create' ? 'Créer' : editMode === 'edit' ? 'Enregistrer' : 'Dupliquer'}
			</button>
		</div>
	</div>
</div>
