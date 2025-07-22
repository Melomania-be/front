<!-- src/lib/components/materials/ProjectMaterialsManager.svelte - Version avec vérification directe -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { Save, AlertCircle, CheckCircle, Music, Plus } from 'lucide-svelte';
	import MaterialSelector from './MaterialSelector.svelte';
	import MaterialEditor from './MaterialEditor.svelte';
	import type { Piece, Material } from '$lib/types';

	const dispatch = createEventDispatcher();

	export let project: any;

	let pieces: any[] = [];
	let isLoading = true;
	let isSaving = false;
	let hasChanges = false;
	let showEditor = false;
	let selectedPieceForNewMaterial: Piece | null = null;
	let errorMessage = '';
	let successMessage = '';

	// État des matériels sélectionnés
	let materialSelections: Record<number, number | null> = {};

	onMount(async () => {
		await loadProjectPieces();
		isLoading = false;
	});

	// ✅ NOUVELLE APPROCHE : Chargement direct depuis la base pivot
	async function loadProjectPieces() {
		if (!project?.pieces) return;

		console.log('🔍 Loading project pieces data...');
		console.log('🎯 Raw project data:', project);

		try {
			// ✅ ÉTAPE 1 : Charger les données directement depuis performed_ins
			const response = await fetch(`/api/debug/performed-ins/${project.id}`);
			if (response.ok) {
				const pivotData = await response.json();
				console.log('📊 Direct pivot data loaded:', pivotData);

				// ✅ ÉTAPE 2 : Combiner avec les données du projet
				pieces = project.pieces.map((piece: any) => {
					// Trouver les données pivot correspondantes
					const pivotInfo = pivotData.performedIns.find((p: any) => p.piece_id === piece.id);

					return {
						...piece,
						// ✅ Utiliser les données pivot directes
						materialSpecified: pivotInfo?.material_specified || false,
						selectedMaterialId: pivotInfo?.material_id || null,
						// ✅ Debug info
						pivotInfo: pivotInfo
					};
				});
			} else {
				console.warn('⚠️ Pivot data loading failed, using fallback');
				// Fallback vers l'ancienne méthode
				await loadProjectPiecesFallback();
				return;
			}
		} catch (error) {
			console.error('❌ Error loading pivot data:', error);
			// Fallback vers l'ancienne méthode
			await loadProjectPiecesFallback();
			return;
		}

		// ✅ ÉTAPE 3 : Initialiser les sélections
		pieces.forEach(piece => {
			materialSelections[piece.id] = piece.selectedMaterialId;
		});

		console.log('🎼 Pieces loaded with pivot data:', pieces.length);
		console.log('📋 Piece details:', pieces.map(p => ({
			id: p.id,
			name: p.name,
			selectedMaterialId: p.selectedMaterialId,
			materialSpecified: p.materialSpecified,
			pivotInfo: p.pivotInfo
		})));
		console.log('📋 Initial material selections:', materialSelections);
	}

	// ✅ FALLBACK : Méthode de chargement d'origine
	async function loadProjectPiecesFallback() {
		try {
			const response = await fetch(`/api/projects/${project.id}`);
			if (response.ok) {
				const fullProjectData = await response.json();
				console.log('📥 Fallback: Full project data loaded:', fullProjectData);

				pieces = fullProjectData.pieces.map((piece: any) => ({
					...piece,
					materialSpecified: piece.pivot_material_specified || false,
					selectedMaterialId: piece.pivot_material_id || null
				}));
			} else {
				// Dernier recours
				pieces = project.pieces.map((piece: any) => ({
					...piece,
					materialSpecified: false,
					selectedMaterialId: null
				}));
			}
		} catch (error) {
			console.error('❌ Fallback also failed:', error);
			pieces = project.pieces.map((piece: any) => ({
				...piece,
				materialSpecified: false,
				selectedMaterialId: null
			}));
		}

		// Initialiser les sélections
		pieces.forEach(piece => {
			materialSelections[piece.id] = piece.selectedMaterialId;
		});
	}

	function handleMaterialSelected(event: CustomEvent, piece: any) {
		const material = event.detail;
		materialSelections[piece.id] = material?.id || null;
		hasChanges = true;
		errorMessage = '';

		console.log(`🎯 Material selected for piece ${piece.id}:`, material?.id || 'none');
	}

	function handleCreateMaterial(event: CustomEvent) {
		selectedPieceForNewMaterial = event.detail;
		showEditor = true;
	}

	async function handleMaterialCreated(event: CustomEvent) {
		const newMaterial = event.detail.material;

		// Assigner automatiquement le nouveau matériel à la pièce
		if (selectedPieceForNewMaterial) {
			materialSelections[selectedPieceForNewMaterial.id] = newMaterial.id;
			hasChanges = true;
		}

		showEditor = false;
		selectedPieceForNewMaterial = null;
	}

	async function saveChanges() {
		if (!hasChanges || isSaving) return;

		isSaving = true;
		errorMessage = '';
		successMessage = '';

		try {
			const updates = pieces.map(piece => ({
				projectId: project.id,
				pieceId: piece.id,
				materialId: materialSelections[piece.id] || null
			}));

			console.log('💾 Saving material assignments:', updates);

			const response = await fetch('/api/materials/assign-bulk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ assignments: updates })
			});

			console.log('📡 Response status:', response.status);

			if (response.ok) {
				const result = await response.json();
				console.log('✅ Save successful:', result);

				hasChanges = false;
				successMessage = result.message || 'Matériels assignés avec succès';

				dispatch('materialsUpdated');

				// ✅ CORRECTION : Recharger directement les données pivot
				setTimeout(async () => {
					console.log('🔄 Reloading pivot data after save...');
					await loadProjectPieces();
					console.log('✅ Data reloaded successfully');
				}, 500);

				// Clear success message after 3 seconds
				setTimeout(() => {
					successMessage = '';
				}, 3000);
			} else {
				const errorData = await response.json();
				console.error('❌ Save failed:', errorData);

				errorMessage = errorData.error || errorData.details?.error || 'Erreur lors de la sauvegarde';

				if (errorData.details) {
					console.error('📋 Error details:', errorData.details);
				}
			}
		} catch (error) {
			console.error('💥 Network/Parse error:', error);
			errorMessage = `Erreur de connexion: ${error.message}`;
		}

		isSaving = false;
	}

	// Clear messages when user makes changes
	function clearMessages() {
		errorMessage = '';
		successMessage = '';
	}

	$: unspecifiedCount = pieces.filter(p => !materialSelections[p.id]).length;
	$: specifiedCount = pieces.filter(p => materialSelections[p.id]).length;

	// ✅ FONCTION DE DEBUG
	async function debugProject() {
		if (import.meta.env.DEV) {
			try {
				const response = await fetch(`/api/debug/project/${project.id}/materials-detailed`);
				const debugData = await response.json();
				console.log('🔬 DEBUG DATA:', debugData);
			} catch (error) {
				console.error('❌ Debug failed:', error);
			}
		}
	}
</script>

<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
	<!-- En-tête -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-xl font-bold text-gray-700 uppercase">Matériels du projet</h3>
			<p class="text-gray-500 mt-1">
				Spécifier les matériels pour chaque pièce du projet
			</p>
		</div>

		<div class="flex gap-2">
			<!-- ✅ BOUTON DE DEBUG -->
			{#if import.meta.env.DEV}
				<button
						class="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
						on:click={debugProject}
				>
					🔬 Debug
				</button>
			{/if}

			{#if hasChanges}
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

	<!-- ✅ DEBUG : Afficher les informations de debug améliorées -->
	{#if import.meta.env.DEV}
		<div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
			<details>
				<summary class="cursor-pointer text-blue-700 font-medium">Debug Info</summary>
				<div class="mt-2 space-y-2">
					<div>
						<strong>Status:</strong>
						<pre class="text-blue-600">{JSON.stringify({
							pieceCount: pieces.length,
							hasChanges,
							specifiedCount,
							unspecifiedCount
						}, null, 2)}</pre>
					</div>
					<div>
						<strong>Material Selections:</strong>
						<pre class="text-blue-600">{JSON.stringify(materialSelections, null, 2)}</pre>
					</div>
					<div>
						<strong>Pieces with Pivot Data:</strong>
						<pre class="text-blue-600">{JSON.stringify(pieces.map(p => ({
							id: p.id,
							name: p.name,
							selectedMaterialId: p.selectedMaterialId,
							materialSpecified: p.materialSpecified,
							hasPivotInfo: !!p.pivotInfo
						})), null, 2)}</pre>
					</div>
				</div>
			</details>
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
						<div class="text-sm text-green-600">Matériels spécifiés</div>
					</div>
				</div>
			</div>

			<div class="p-4 bg-orange-50 rounded-lg border border-orange-200">
				<div class="flex items-center gap-2">
					<AlertCircle class="text-orange-600" size={20} />
					<div>
						<div class="font-semibold text-orange-800">{unspecifiedCount}</div>
						<div class="text-sm text-orange-600">À spécifier</div>
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
		<div class="space-y-4">
			{#each pieces as piece, index}
				<div class="p-4 border border-gray-200 rounded-lg hover:border-[#6B9AD9] transition-colors {
					!materialSelections[piece.id] ? 'bg-orange-50 border-orange-200' : 'bg-white'
				}">
					<div class="flex items-start gap-4">
						<!-- Informations de la pièce -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-2">
								<h4 class="font-semibold text-gray-900 truncate">
									{index + 1}. {piece.name}
								</h4>
								{#if !materialSelections[piece.id]}
									<AlertCircle class="text-orange-500 flex-shrink-0" size={16} />
								{:else}
									<CheckCircle class="text-green-500 flex-shrink-0" size={16} />
								{/if}
								<!-- ✅ Indicateur de debug -->
								{#if import.meta.env.DEV && piece.pivotInfo}
									<span class="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
										DB: {piece.pivotInfo.material_id || 'null'}
									</span>
								{/if}
							</div>

							{#if piece.composer}
								<p class="text-sm text-gray-600 mb-2">
									{piece.composer.shortName || piece.composer.longName}
									{#if piece.opus}• Op. {piece.opus}{/if}
									{#if piece.yearOfComposition}• {piece.yearOfComposition}{/if}
								</p>
							{/if}

							<!-- Sélecteur de matériel -->
							<div class="max-w-md">
								<label class="block text-sm font-medium text-gray-700 mb-2">
									Matériel à utiliser :
								</label>
								<MaterialSelector
										{piece}
										projectId={project.id}
										selectedMaterialId={materialSelections[piece.id]}
										required={true}
										on:materialSelected={(e) => {
										handleMaterialSelected(e, piece);
										clearMessages();
									}}
										on:createMaterial={handleCreateMaterial}
								/>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Message d'aide -->
		{#if unspecifiedCount > 0}
			<div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
				<div class="flex items-start gap-3">
					<AlertCircle class="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
					<div>
						<h5 class="font-medium text-blue-800 mb-1">Matériels manquants</h5>
						<p class="text-sm text-blue-700">
							{unspecifiedCount} pièce{unspecifiedCount !== 1 ? 's' : ''} nécessite{unspecifiedCount === 1 ? '' : 'nt'}
							encore la spécification d'un matériel. Vous pouvez créer de nouveaux matériels
							directement depuis les menus déroulants ci-dessus.
						</p>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Modal de création de matériel -->
{#if showEditor && selectedPieceForNewMaterial}
	<MaterialEditor
			piece={selectedPieceForNewMaterial}
			editMode="create"
			on:saved={handleMaterialCreated}
			on:cancelled={() => {
			showEditor = false;
			selectedPieceForNewMaterial = null;
		}}
	/>
{/if}