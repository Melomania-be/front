<!-- src/lib/components/materials/ProjectMaterialsManager.svelte - Version complète avec upload de fichiers -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { Save, AlertCircle, CheckCircle, Music, Plus, Upload, FileText, Download, Eye, Trash2, Edit } from 'lucide-svelte';
	import MaterialSelector from './MaterialSelector.svelte';
	import MaterialEditor from './MaterialEditor.svelte';
	import FileUploader from '../filesystem/FileUploader.svelte';
	import type { Piece, Material } from '$lib/types';

	const dispatch = createEventDispatcher();

	export let project: any;

	let pieces: any[] = [];
	let materialsData: Record<number, Material[]> = {}; // Stocker les matériels pour chaque pièce
	let isLoading = true;
	let isSaving = false;
	let hasChanges = false;
	let showEditor = false;
	let showUploader = false;
	let selectedPieceForNewMaterial: Piece | null = null;
	let selectedMaterialForUpload: Material | null = null;
	let errorMessage = '';
	let successMessage = '';

	// État des matériels sélectionnés
	let materialSelections: Record<number, number | null> = {};

	onMount(async () => {
		await loadProjectPieces();
		await loadAllMaterials();
		isLoading = false;
	});

	// Chargement des données du projet avec les matériels
	async function loadProjectPieces() {
		try {
			console.log('🔄 Loading project pieces with materials...');

			const response = await fetch(`/api/projects/${project.id}`);
			if (response.ok) {
				const fullProjectData = await response.json();
				console.log('📊 Loaded project data:', {
					projectId: fullProjectData.id,
					piecesCount: fullProjectData.pieces?.length || 0,
					samplePiece: fullProjectData.pieces?.[0] ? {
						id: fullProjectData.pieces[0].id,
						name: fullProjectData.pieces[0].name,
						pivot_material_id: fullProjectData.pieces[0].pivot_material_id,
						pivot_material_specified: fullProjectData.pieces[0].pivot_material_specified
					} : null
				});

				// Mapper correctement les pièces avec les données pivot
				pieces = (fullProjectData.pieces || []).map((piece: any) => ({
					...piece,
					materialSpecified: Boolean(piece.pivot_material_specified || false),
					selectedMaterialId: piece.pivot_material_id || null
				}));

				console.log('📊 Mapped pieces:', pieces.map(p => ({
					id: p.id,
					name: p.name,
					materialSpecified: p.materialSpecified,
					selectedMaterialId: p.selectedMaterialId
				})));
			} else {
				console.error('Failed to load project data:', response.status);
				pieces = (project.pieces || []).map((piece: any) => ({
					...piece,
					materialSpecified: false,
					selectedMaterialId: null
				}));
			}
		} catch (error) {
			console.error('Failed to load project data:', error);
			pieces = (project.pieces || []).map((piece: any) => ({
				...piece,
				materialSpecified: false,
				selectedMaterialId: null
			}));
		}

		// Initialiser les sélections avec les données existantes
		materialSelections = {};
		pieces.forEach(piece => {
			materialSelections[piece.id] = piece.selectedMaterialId;
		});

		console.log('🎯 Initial material selections:', materialSelections);
	}

	// ✅ NOUVEAU : Charger tous les matériels pour chaque pièce
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
			// Force reactivity
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

		// Force reactivity
		materialSelections = { ...materialSelections };
	}

	function handleCreateMaterial(event: CustomEvent) {
		selectedPieceForNewMaterial = event.detail;
		showEditor = true;
	}

	async function handleMaterialCreated(event: CustomEvent) {
		const newMaterial = event.detail.material;

		// Recharger les matériels pour cette pièce
		if (selectedPieceForNewMaterial) {
			await loadMaterialsForPiece(selectedPieceForNewMaterial.id);
			materialSelections[selectedPieceForNewMaterial.id] = newMaterial.id;
			hasChanges = true;
			materialSelections = { ...materialSelections };
		}

		showEditor = false;
		selectedPieceForNewMaterial = null;
	}

	// ✅ NOUVEAU : Charger les matériels d'une pièce spécifique
	async function loadMaterialsForPiece(pieceId: number) {
		try {
			const response = await fetch(`/api/materials/piece/${pieceId}`);
			if (response.ok) {
				materialsData[pieceId] = await response.json();
				materialsData = { ...materialsData };
			}
		} catch (error) {
			console.error('Error loading materials for piece:', pieceId, error);
		}
	}

	// ✅ NOUVEAU : Ouvrir l'upload pour un matériel
	function openUploadForMaterial(material: Material) {
		selectedMaterialForUpload = material;
		showUploader = true;
		console.log('📤 Opening uploader for material:', material.name);
	}

	// Dans handleFileUpload()
	async function handleFileUpload(files: FileList) {
		if (!selectedMaterialForUpload) {
			console.error('❌ No material selected for upload')
			return
		}

		console.log('📤 Uploading files to material:', selectedMaterialForUpload.name)

		const formData = new FormData()
		Array.from(files).forEach((file, index) => {
			console.log(`📄 Adding file ${index + 1}: ${file.name}`)
			formData.append('files', file)
		})

		try {
			const response = await fetch(`/api/materials/${selectedMaterialForUpload.id}/files`, {
				method: 'POST',
				body: formData
			})

			const responseData = await response.json()
			console.log('📥 Response:', responseData)

			if (response.ok && responseData.success) {
				console.log('✅ Upload successful!')

				// Recharger les matériels pour toutes les pièces
				await loadAllMaterials()

				// Recharger les données du projet
				await loadProjectPieces()

				// Notifier le composant parent
				dispatch('materialsUpdated')

				showUploader = false
				selectedMaterialForUpload = null

				successMessage = responseData.message
				if (responseData.errors && responseData.errors.length > 0) {
					errorMessage = `Avertissements: ${responseData.errors.join(', ')}`
				}

				setTimeout(() => {
					successMessage = ''
					errorMessage = ''
				}, 5000)

			} else {
				console.error('❌ Upload failed:', responseData)
				errorMessage = responseData.error || 'Erreur lors de l\'upload'
				if (responseData.errors) {
					errorMessage += ': ' + responseData.errors.join(', ')
				}
			}
		} catch (error) {
			console.error('❌ Upload error:', error)
			errorMessage = 'Erreur de connexion lors de l\'upload'
		}
	}

	async function saveChanges() {
		if (!hasChanges || isSaving) return;

		isSaving = true;
		errorMessage = '';
		successMessage = '';

		try {
			console.log('💾 Saving material assignments:', materialSelections);

			const updates = pieces.map(piece => ({
				projectId: project.id,
				pieceId: piece.id,
				materialId: materialSelections[piece.id] || null
			}));

			console.log('📤 Sending updates:', updates);

			const response = await fetch('/api/materials/assign-bulk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ assignments: updates })
			});

			const result = await response.json();
			console.log('📥 Response:', result);

			if (response.ok) {
				hasChanges = false;
				successMessage = result.message || 'Matériels assignés avec succès';

				dispatch('materialsUpdated');

				// Recharger les données après un délai
				setTimeout(async () => {
					await loadProjectPieces();
				}, 500);

				// Effacer le message de succès après 3 secondes
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

	// Clear messages when user makes changes
	function clearMessages() {
		errorMessage = '';
		successMessage = '';
	}

	$: unspecifiedCount = pieces.filter(p => !materialSelections[p.id]).length;
	$: specifiedCount = pieces.filter(p => materialSelections[p.id]).length;
	$: changedCount = pieces.filter(p => materialSelections[p.id] !== p.selectedMaterialId).length;

	// ✅ NOUVEAU : Obtenir le matériel sélectionné pour une pièce
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
			<h3 class="text-xl font-bold text-gray-700 uppercase">Matériels du projet</h3>
			<p class="text-gray-500 mt-1">
				Spécifier les matériels pour chaque pièce du projet "{project.name}"
			</p>
		</div>

		<div class="flex gap-2">
			{#if hasChanges}
				<div class="text-sm text-orange-600 mr-4">
					{changedCount} modification{changedCount !== 1 ? 's' : ''} en attente
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
		<!-- Liste des pièces avec gestion des fichiers -->
		<div class="space-y-6">
			{#each pieces as piece, index}
				{@const isSpecified = !!materialSelections[piece.id]}
				{@const hasChanged = materialSelections[piece.id] !== piece.selectedMaterialId}
				{@const selectedMaterial = getSelectedMaterial(piece.id)}

				<div class="p-6 border border-gray-200 rounded-lg hover:border-[#6B9AD9] transition-colors {
					!isSpecified ? 'bg-orange-50 border-orange-200' : hasChanged ? 'bg-blue-50 border-blue-200' : 'bg-white'
				}">
					<div class="flex items-start gap-4">
						<!-- Informations de la pièce -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-3">
								<h4 class="text-lg font-semibold text-gray-900">
									{index + 1}. {piece.name}
								</h4>
								{#if !isSpecified}
									<AlertCircle class="text-orange-500 flex-shrink-0" size={16} />
								{:else if hasChanged}
									<div class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Modifié</div>
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
											required={true}
											on:materialSelected={(e) => {
											handleMaterialSelected(e, piece);
											clearMessages();
										}}
											on:createMaterial={handleCreateMaterial}
									/>
								</div>
							</div>

							<!-- ✅ NOUVEAU : Section de gestion des fichiers -->
							{#if selectedMaterial}
								<div class="border-t pt-4 mt-4">
									<div class="flex items-center justify-between mb-3">
										<div class="flex items-center gap-3">
											<h5 class="font-medium text-gray-700">Fichiers du matériel "{selectedMaterial.name}" :</h5>
											<div class="flex items-center gap-2 text-sm">
												<FileText class="text-blue-500" size={16} />
												<span class="text-blue-600 font-medium">{selectedMaterial.files_count || 0} fichier{selectedMaterial.files_count !== 1 ? 's' : ''}</span>
											</div>
										</div>

										<!-- ✅ BOUTON UPLOAD PRINCIPAL -->
										<button
												class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md"
												on:click={() => openUploadForMaterial(selectedMaterial)}
										>
											<Upload size={16} />
											<span class="font-medium">Ajouter fichiers</span>
										</button>
									</div>

									<!-- Informations sur le matériel -->
									<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
										{#if selectedMaterial.description}
											<div>
												<span class="font-medium text-gray-600">Description :</span>
												<p class="text-gray-700 mt-1">{selectedMaterial.description}</p>
											</div>
										{/if}
										{#if selectedMaterial.edition}
											<div>
												<span class="font-medium text-gray-600">Édition :</span>
												<p class="text-gray-700 mt-1">{selectedMaterial.edition}</p>
											</div>
										{/if}
										{#if selectedMaterial.editor}
											<div>
												<span class="font-medium text-gray-600">Éditeur :</span>
												<p class="text-gray-700 mt-1">{selectedMaterial.editor}</p>
											</div>
										{/if}
									</div>

									<!-- Statut du matériel -->
									<div class="mt-3 flex items-center gap-4 text-sm">
										{#if selectedMaterial.is_default}
											<div class="flex items-center gap-1 text-yellow-600">
												<CheckCircle size={14} />
												<span>Matériel par défaut</span>
											</div>
										{/if}
										<div class="text-gray-500">
											Créé le {new Date(selectedMaterial.createdAt).toLocaleDateString('fr-FR')}
										</div>
									</div>
								</div>
							{/if}

							<!-- Affichage de l'état actuel vs nouveau -->
							{#if hasChanged}
								<div class="mt-2 text-xs text-gray-600 bg-blue-100 p-2 rounded">
									{#if piece.selectedMaterialId}
										Actuellement : Matériel #{piece.selectedMaterialId}
									{:else}
										Actuellement : Non spécifié
									{/if}
									→
									{#if materialSelections[piece.id]}
										Nouveau : Matériel #{materialSelections[piece.id]}
									{:else}
										Nouveau : Non spécifié
									{/if}
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

<!-- ✅ NOUVEAU : Modal d'upload avec titre explicite -->
{#if showUploader && selectedMaterialForUpload}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
			<!-- En-tête avec info sur le matériel -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
				<div>
					<h3 class="text-xl font-bold text-gray-800">Ajouter des fichiers</h3>
					<p class="text-sm text-gray-600 mt-1">
						Au matériel: <strong>{selectedMaterialForUpload.name}</strong>
					</p>
					<p class="text-xs text-gray-500">
						{selectedMaterialForUpload.files_count || 0} fichier{selectedMaterialForUpload.files_count !== 1 ? 's' : ''} actuellement
					</p>
				</div>
				<button
						class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
						on:click={() => {
						showUploader = false;
						selectedMaterialForUpload = null;
					}}
				>
					✕
				</button>
			</div>

			<!-- Composant upload -->
			<div class="p-6">
				<FileUploader
						on:upload={(e) => handleFileUpload(e.detail)}
						on:cancel={() => {
						showUploader = false;
						selectedMaterialForUpload = null;
					}}
				/>
			</div>
		</div>
	</div>
{/if}