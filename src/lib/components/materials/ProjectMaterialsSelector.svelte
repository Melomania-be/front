<!-- src/lib/components/materials/ProjectMaterialsSelector.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { Save, AlertCircle, CheckCircle, Music, Package, FileText } from 'lucide-svelte';
	import MaterialSelector from './MaterialSelector.svelte';
	import type { Piece, Material } from '$lib/types';

	const dispatch = createEventDispatcher();

	export let project: any;

	let pieces: any[] = [];
	let materialsData: Record<number, Material[]> = {};
	let isLoading = true;
	let isSaving = false;
	let hasChanges = false;
	let errorMessage = '';
	let successMessage = '';

	// État des matériels sélectionnés - AUCUNE PRÉ-ASSIGNATION
	let materialSelections: Record<number, number | null> = {};

	onMount(async () => {
		await loadProjectPieces();
		await loadAllMaterials();
		isLoading = false;
	});

	async function loadProjectPieces() {
		try {
			console.log('🔄 Loading project pieces WITHOUT pre-assignments...');

			// Charger uniquement les pièces du projet, sans les matériels pré-assignés
			const response = await fetch(`/api/projects/${project.id}/pieces`);
			if (response.ok) {
				pieces = await response.json();
				console.log(`📊 Loaded ${pieces.length} pieces for new project`);
			} else {
				console.error('Failed to load project pieces:', response.status);
				pieces = project.pieces || [];
			}

			// Initialiser les sélections à NULL - AUCUNE PRÉ-ASSIGNATION
			materialSelections = {};
			pieces.forEach(piece => {
				materialSelections[piece.id] = null; // Toujours null au départ
			});

			console.log('🎯 Initialized empty material selections:', materialSelections);
		} catch (error) {
			console.error('Failed to load project pieces:', error);
			pieces = project.pieces || [];

			// Même en cas d'erreur, pas de pré-assignation
			materialSelections = {};
			pieces.forEach(piece => {
				materialSelections[piece.id] = null;
			});
		}
	}

	async function loadAllMaterials() {
		try {
			for (const piece of pieces) {
				const response = await fetch(`/api/materials/piece/${piece.id}`);
				if (response.ok) {
					materialsData[piece.id] = await response.json();
				} else {
					materialsData[piece.id] = [];
				}
			}
			materialsData = { ...materialsData };
		} catch (error) {
			console.error('Error loading materials:', error);
		}
	}

	function handleMaterialSelected(event: CustomEvent, piece: any) {
		const material = event.detail;
		const newMaterialId = material?.id || null;

		console.log(`🎵 Material selected for piece ${piece.id}:`, {
			pieceName: piece.name,
			materialId: newMaterialId,
			materialName: material?.name || 'None'
		});

		materialSelections[piece.id] = newMaterialId;
		hasChanges = true;
		errorMessage = '';

		materialSelections = { ...materialSelections };
	}

	async function saveChanges() {
		if (!hasChanges || isSaving) return;

		isSaving = true;
		errorMessage = '';
		successMessage = '';

		try {
			console.log('💾 Saving NEW material assignments:', materialSelections);

			const updates = pieces.map(piece => ({
				projectId: project.id,
				pieceId: piece.id,
				materialId: materialSelections[piece.id] || null
			}));

			console.log('📤 Sending NEW assignments:', updates);

			const response = await fetch('/api/materials/assign-bulk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ assignments: updates })
			});

			const result = await response.json();

			if (response.ok) {
				hasChanges = false;
				successMessage = result.message || 'Matériels assignés avec succès';
				dispatch('materialsUpdated');

				setTimeout(() => {
					successMessage = '';
				}, 3000);
			} else {
				console.error('Save failed:', result);
				errorMessage = result.error || result.details?.error || 'Erreur lors de la sauvegarde';
			}
		} catch (error) {
			console.error('Network/Parse error:', error);
			errorMessage = `Erreur de connexion: ${error.message}`;
		}

		isSaving = false;
	}

	function clearMessages() {
		errorMessage = '';
		successMessage = '';
	}

	$: unspecifiedCount = pieces.filter(p => !materialSelections[p.id]).length;
	$: specifiedCount = pieces.filter(p => materialSelections[p.id]).length;

	function getSelectedMaterial(pieceId: number): Material | null {
		const materialId = materialSelections[pieceId];
		if (!materialId || !materialsData[pieceId]) return null;
		return materialsData[pieceId].find(m => m.id === materialId) || null;
	}
</script>

<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
	<!-- En-tête -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-xl font-bold text-gray-700 uppercase">Sélection des matériels</h3>
			<p class="text-gray-500 mt-1">
				Choisir les matériels à utiliser pour chaque pièce du projet "{project.name}"
			</p>
			<div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
				<p class="text-sm text-blue-700">
					<strong>Nouveau projet :</strong> Aucun matériel n'est pré-assigné.
					Sélectionnez manuellement les matériels à utiliser pour chaque pièce.
				</p>
			</div>
		</div>

		<div class="flex gap-2">
			{#if hasChanges}
				<div class="text-sm text-orange-600 mr-4">
					{specifiedCount} matériel{specifiedCount !== 1 ? 's' : ''} sélectionné{specifiedCount !== 1 ? 's' : ''}
				</div>
				<button
					class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
					on:click={saveChanges}
					disabled={isSaving}
				>
					{#if isSaving}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					{:else}
						<Save size={16} />
					{/if}
					Enregistrer
				</button>
			{/if}
		</div>
	</div>

	<!-- Messages d'erreur et de succès -->
	{#if errorMessage}
		<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
			<div class="flex items-center gap-2">
				<AlertCircle class="text-red-600 flex-shrink-0" size={16} />
				<p class="text-sm text-red-700">{errorMessage}</p>
			</div>
		</div>
	{/if}

	{#if successMessage}
		<div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
			<div class="flex items-center gap-2">
				<CheckCircle class="text-green-600 flex-shrink-0" size={16} />
				<p class="text-sm text-green-700">{successMessage}</p>
			</div>
		</div>
	{/if}

	<!-- Résumé du statut -->
	{#if !isLoading}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
			<div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
				<div class="flex items-center gap-2">
					<Music class="text-blue-600" size={20} />
					<div>
						<div class="font-semibold text-blue-800">{pieces.length}</div>
						<div class="text-sm text-blue-600">Pièces totales</div>
					</div>
				</div>
			</div>

			<div class="p-4 bg-green-50 rounded-lg border border-green-200">
				<div class="flex items-center gap-2">
					<CheckCircle class="text-green-600" size={20} />
					<div>
						<div class="font-semibold text-green-800">{specifiedCount}</div>
						<div class="text-sm text-green-600">Matériels sélectionnés</div>
					</div>
				</div>
			</div>

			<div class="p-4 bg-orange-50 rounded-lg border border-orange-200">
				<div class="flex items-center gap-2">
					<AlertCircle class="text-orange-600" size={20} />
					<div>
						<div class="font-semibold text-orange-800">{unspecifiedCount}</div>
						<div class="text-sm text-orange-600">À sélectionner</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if isLoading}
		<div class="flex justify-center items-center h-32">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B9AD9]"></div>
		</div>
	{:else if pieces.length === 0}
		<div class="text-center py-8">
			<Music class="mx-auto mb-4 text-gray-400" size={48} />
			<p class="text-gray-500 mb-4">Aucune pièce dans ce projet</p>
		</div>
	{:else}
		<!-- Liste des pièces -->
		<div class="space-y-6">
			{#each pieces as piece, index}
				{@const isSpecified = !!materialSelections[piece.id]}
				{@const selectedMaterial = getSelectedMaterial(piece.id)}

				<div class="p-6 border border-gray-200 rounded-lg hover:border-[#6B9AD9] transition-colors {
					!isSpecified ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
				}">
					<div class="flex items-start gap-4">
						<div class="flex-1 min-w-0">
							<!-- En-tête de la pièce -->
							<div class="flex items-center gap-2 mb-2">
								<h4 class="text-lg font-semibold text-gray-900">
									{index + 1}. {piece.name}
								</h4>
								{#if !isSpecified}
									<AlertCircle class="text-orange-500 flex-shrink-0" size={16} />
								{:else}
									<CheckCircle class="text-green-500 flex-shrink-0" size={16} />
								{/if}
							</div>

							{#if piece.composer}
								<p class="text-sm text-gray-600 mb-4">
									{piece.composer.shortName || piece.composer.longName}
									{#if piece.opus}• Op. {piece.opus}{/if}
									{#if piece.yearOfComposition}• {piece.yearOfComposition}{/if}
								</p>
							{/if}

							<!-- Sélecteur de matériel -->
							<div class="mb-4">
								<label class="block text-sm font-medium text-gray-700 mb-2">
									Matériel à utiliser :
								</label>
								<div class="max-w-md">
									<MaterialSelector
										{piece}
										projectId={project.id}
										selectedMaterialId={materialSelections[piece.id]}
										required={false}
										on:materialSelected={(e) => {
											handleMaterialSelected(e, piece);
											clearMessages();
										}}
										on:createMaterial={() => {
											// Rediriger vers la création globale de matériels
											dispatch('openGlobalMaterials');
										}}
									/>
								</div>
							</div>

							<!-- Informations sur le matériel sélectionné -->
							{#if selectedMaterial}
								<div class="mt-4 p-3 bg-white border border-green-200 rounded-lg">
									<div class="flex items-center justify-between mb-2">
										<h5 class="font-medium text-gray-700">Matériel sélectionné :</h5>
										<div class="flex items-center gap-2 text-sm">
											<FileText class="text-blue-500" size={16} />
											<span class="text-blue-600 font-medium">{selectedMaterial.files_count || 0} fichier{selectedMaterial.files_count !== 1 ? 's' : ''}</span>
										</div>
									</div>

									<div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
										{#if selectedMaterial.description}
											<div>
												<span class="font-medium text-gray-600">Description :</span>
												<p class="text-gray-700">{selectedMaterial.description}</p>
											</div>
										{/if}
										{#if selectedMaterial.edition}
											<div>
												<span class="font-medium text-gray-600">Édition :</span>
												<p class="text-gray-700">{selectedMaterial.edition}</p>
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Message d'aide -->
		{#if unspecifiedCount > 0}
			<div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
				<div class="flex items-start gap-3">
					<Package class="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
					<div>
						<h5 class="font-medium text-blue-800 mb-1">Matériels à sélectionner</h5>
						<p class="text-sm text-blue-700">
							{unspecifiedCount} pièce{unspecifiedCount !== 1 ? 's' : ''} nécessite{unspecifiedCount === 1 ? '' : 'nt'}
							encore la sélection d'un matériel. Vous pouvez créer de nouveaux matériels
							depuis l'onglet "Matériels" de cette section.
						</p>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>