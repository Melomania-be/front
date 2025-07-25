<!-- src/lib/components/materials/ProjectMaterialAssignment.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import {
		Save,
		AlertCircle,
		CheckCircle,
		Music,
		Package,
		FileText,
		Star,
		ChevronDown,
		RefreshCw
	} from 'lucide-svelte';

	const dispatch = createEventDispatcher();

	export let project: any;

	let pieces: any[] = [];
	let materialsData: Record<number, any[]> = {}; // Tous les matériels disponibles par pièce
	let projectAssignments: Record<number, number | null> = {}; // Assignations du projet
	let isLoading = true;
	let isSaving = false;
	let hasChanges = false;
	let errorMessage = '';
	let successMessage = '';

	onMount(async () => {
		await loadProjectData();
		isLoading = false;
	});

	async function loadProjectData() {
		try {
			console.log('🔄 Loading project data for assignments...');

			// 1. Charger les pièces du projet
			await loadProjectPieces();

			// 2. Charger tous les matériels disponibles pour chaque pièce
			await loadAvailableMaterials();

			// 3. Charger les assignations actuelles du projet (si elles existent)
			await loadCurrentAssignments();

		} catch (error) {
			console.error('Error loading project data:', error);
		}
	}

	async function loadProjectPieces() {
		try {
			// Charger les pièces du projet sans pré-assignations
			pieces = project.pieces || [];
			console.log(`📊 Loaded ${pieces.length} pieces for project`);
		} catch (error) {
			console.error('Error loading project pieces:', error);
		}
	}

	async function loadAvailableMaterials() {
		try {
			// Pour chaque pièce, charger TOUS les matériels disponibles
			for (const piece of pieces) {
				const response = await fetch(`/api/materials/piece/${piece.id}`);
				if (response.ok) {
					const materials = await response.json();

					// Charger aussi le nombre de fichiers pour chaque matériel
					for (const material of materials) {
						try {
							const filesResponse = await fetch(`/api/materials/${material.id}/files`);
							if (filesResponse.ok) {
								const files = await filesResponse.json();
								material.files_count = Array.isArray(files) ? files.length : 0;
							} else {
								material.files_count = material.files?.length || 0;
							}
						} catch (error) {
							material.files_count = material.files?.length || 0;
						}
					}

					materialsData[piece.id] = materials;
					console.log(`📦 Loaded ${materials.length} materials for piece: ${piece.name}`);
				} else {
					materialsData[piece.id] = [];
				}
			}

			materialsData = { ...materialsData };
		} catch (error) {
			console.error('Error loading available materials:', error);
		}
	}

	async function loadCurrentAssignments() {
		try {
			// ✅ NOUVEAU : Charger les assignations spécifiques à ce projet
			const response = await fetch(`/api/projects/${project.id}/material-assignments`);
			if (response.ok) {
				const assignments = await response.json();

				// Mapper les assignations
				for (const assignment of assignments) {
					projectAssignments[assignment.piece_id] = assignment.material_id;
				}

				console.log('📋 Loaded current assignments:', projectAssignments);
			} else if (response.status === 404) {
				// Pas d'assignations existantes - c'est normal pour un nouveau projet
				console.log('📋 No existing assignments found - fresh project');

				// ✅ COMPORTEMENT VOULU : Aucune pré-assignation pour nouveau projet
				pieces.forEach(piece => {
					projectAssignments[piece.id] = null;
				});
			}

			projectAssignments = { ...projectAssignments };
		} catch (error) {
			console.error('Error loading current assignments:', error);

			// En cas d'erreur, initialiser sans assignations
			pieces.forEach(piece => {
				projectAssignments[piece.id] = null;
			});
			projectAssignments = { ...projectAssignments };
		}
	}

	function handleMaterialSelection(pieceId: number, materialId: number | null) {
		const oldValue = projectAssignments[pieceId];
		projectAssignments[pieceId] = materialId;

		// Marquer comme changé si c'est différent de la valeur initiale
		hasChanges = true;
		errorMessage = '';

		projectAssignments = { ...projectAssignments };

		console.log(`🎵 Material selection for piece ${pieceId}:`, {
			old: oldValue,
			new: materialId,
			materialName: materialId ? getMaterialName(pieceId, materialId) : 'None'
		});
	}

	async function saveAssignments() {
		if (!hasChanges || isSaving) return;

		isSaving = true;
		errorMessage = '';
		successMessage = '';

		try {
			console.log('💾 Saving material assignments for project:', project.id);

			// Préparer les données d'assignation
			const assignments = pieces.map(piece => ({
				project_id: project.id,
				piece_id: piece.id,
				material_id: projectAssignments[piece.id]
			}));

			console.log('📤 Sending assignments:', assignments);

			const response = await fetch(`/api/projects/${project.id}/material-assignments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ assignments })
			});

			if (response.ok) {
				const result = await response.json();
				hasChanges = false;
				successMessage = result.message || 'Assignations sauvegardées avec succès';

				dispatch('assignmentsUpdated');

				setTimeout(() => {
					successMessage = '';
				}, 3000);
			} else {
				const error = await response.json();
				errorMessage = error.message || 'Erreur lors de la sauvegarde';
			}
		} catch (error) {
			console.error('Error saving assignments:', error);
			errorMessage = 'Erreur de connexion lors de la sauvegarde';
		}

		isSaving = false;
	}

	function getMaterialName(pieceId: number, materialId: number): string {
		const materials = materialsData[pieceId] || [];
		const material = materials.find(m => m.id === materialId);
		return material?.name || 'Matériel inconnu';
	}

	function getSelectedMaterial(pieceId: number) {
		const materialId = projectAssignments[pieceId];
		if (!materialId) return null;

		const materials = materialsData[pieceId] || [];
		return materials.find(m => m.id === materialId) || null;
	}

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	// Statistiques
	$: assignedCount = pieces.filter(p => projectAssignments[p.id]).length;
	$: unassignedCount = pieces.filter(p => !projectAssignments[p.id]).length;
	$: totalFiles = pieces.reduce((total, piece) => {
		const material = getSelectedMaterial(piece.id);
		return total + (material?.files_count || 0);
	}, 0);
</script>

<div class="space-y-6">
	<!-- En-tête -->
	<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
		<div class="flex items-center justify-between mb-6">
			<div>
				<h2 class="text-2xl font-bold text-gray-700 uppercase">Assignation des matériels</h2>
				<p class="text-gray-500 mt-1">
					Projet : <strong>{project.name}</strong>
				</p>
				<div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
					<p class="text-sm text-blue-700">
						<strong>Nouveau projet :</strong> Sélectionnez manuellement les matériels à utiliser pour chaque pièce.
						Aucun matériel n'est pré-assigné.
					</p>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<button
					class="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
					on:click={loadProjectData}
					disabled={isLoading}
				>
					<RefreshCw size={16} class={isLoading ? 'animate-spin' : ''} />
					Actualiser
				</button>

				{#if hasChanges}
					<div class="text-sm text-orange-600 mr-2">
						{assignedCount} assignation{assignedCount !== 1 ? 's' : ''} configurée{assignedCount !== 1 ? 's' : ''}
					</div>
					<button
						class="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-semibold"
						on:click={saveAssignments}
						disabled={isSaving}
					>
						{#if isSaving}
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
						{:else}
							<Save size={16} />
						{/if}
						Enregistrer les assignations
					</button>
				{/if}
			</div>
		</div>

		<!-- Messages -->
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

		<!-- Statistiques -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
						<div class="font-semibold text-green-800">{assignedCount}</div>
						<div class="text-sm text-green-600">Assignées</div>
					</div>
				</div>
			</div>

			<div class="p-4 bg-orange-50 rounded-lg border border-orange-200">
				<div class="flex items-center gap-2">
					<AlertCircle class="text-orange-600" size={20} />
					<div>
						<div class="font-semibold text-orange-800">{unassignedCount}</div>
						<div class="text-sm text-orange-600">À assigner</div>
					</div>
				</div>
			</div>

			<div class="p-4 bg-purple-50 rounded-lg border border-purple-200">
				<div class="flex items-center gap-2">
					<FileText class="text-purple-600" size={20} />
					<div>
						<div class="font-semibold text-purple-800">{totalFiles}</div>
						<div class="text-sm text-purple-600">Fichiers totaux</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Liste des pièces avec sélection de matériels -->
	<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
		{#if isLoading}
			<div class="flex justify-center items-center h-32">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B9AD9]"></div>
			</div>
		{:else if pieces.length === 0}
			<div class="text-center py-8">
				<Music class="mx-auto mb-4 text-gray-400" size={48} />
				<p class="text-gray-500">Aucune pièce dans ce projet</p>
			</div>
		{:else}
			<div class="space-y-6">
				{#each pieces as piece, index}
					{@const availableMaterials = materialsData[piece.id] || []}
					{@const selectedMaterial = getSelectedMaterial(piece.id)}
					{@const isAssigned = !!projectAssignments[piece.id]}

					<div class="border border-gray-200 rounded-lg p-6 hover:border-[#6B9AD9] transition-colors {
						!isAssigned ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
					}">
						<!-- En-tête de la pièce -->
						<div class="flex items-start justify-between mb-4">
							<div class="flex-1">
								<div class="flex items-center gap-2 mb-2">
									<h3 class="text-lg font-semibold text-gray-900">
										{index + 1}. {piece.name}
									</h3>
									{#if !isAssigned}
										<AlertCircle class="text-orange-500 flex-shrink-0" size={16} />
									{:else}
										<CheckCircle class="text-green-500 flex-shrink-0" size={16} />
									{/if}
								</div>

								{#if piece.composer}
									<p class="text-sm text-gray-600 mb-3">
										{piece.composer.shortName || piece.composer.longName}
										{#if piece.opus}• Op. {piece.opus}{/if}
										{#if piece.yearOfComposition}• {piece.yearOfComposition}{/if}
									</p>
								{/if}
							</div>
						</div>

						<!-- Sélection du matériel -->
						<div class="mb-4">
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Matériel à utiliser dans ce projet :
							</label>

							{#if availableMaterials.length === 0}
								<div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
									<p class="text-sm text-yellow-700">
										Aucun matériel disponible pour cette pièce.
										<button class="text-yellow-800 underline hover:no-underline">
											Créer un matériel
										</button>
									</p>
								</div>
							{:else}
								<div class="relative">
									<select
										bind:value={projectAssignments[piece.id]}
										on:change={() => handleMaterialSelection(piece.id, projectAssignments[piece.id])}
										class="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent {
											!isAssigned ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'
										}"
									>
										<option value={null}>-- Aucun matériel sélectionné --</option>
										{#each availableMaterials as material}
											<option value={material.id}>
												{material.name}
												{#if material.is_default}(par défaut){/if}
												- {material.files_count} fichier{material.files_count !== 1 ? 's' : ''}
												{#if material.edition}• {material.edition}{/if}
											</option>
										{/each}
									</select>
								</div>
							{/if}
						</div>

						<!-- Informations sur le matériel sélectionné -->
						{#if selectedMaterial}
							<div class="mt-4 p-4 bg-white border border-green-200 rounded-lg">
								<div class="flex items-center justify-between mb-3">
									<div class="flex items-center gap-2">
										<h4 class="font-medium text-gray-800">Matériel sélectionné :</h4>
										<span class="font-semibold text-green-700">{selectedMaterial.name}</span>
										{#if selectedMaterial.is_default}
											<Star class="text-yellow-500 fill-current" size={16} />
										{/if}
									</div>
									<div class="flex items-center gap-2 text-sm">
										<FileText class="text-blue-500" size={16} />
										<span class="font-semibold text-blue-600">
											{selectedMaterial.files_count} fichier{selectedMaterial.files_count !== 1 ? 's' : ''}
										</span>
									</div>
								</div>

								<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
									{#if selectedMaterial.editor}
										<div>
											<span class="font-medium text-gray-600">Éditeur :</span>
											<p class="text-gray-700">{selectedMaterial.editor}</p>
										</div>
									{/if}
								</div>

								{#if selectedMaterial.notes}
									<div class="mt-3 p-2 bg-blue-50 rounded text-sm">
										<span class="font-medium text-blue-800">Notes :</span>
										<span class="text-blue-700">{selectedMaterial.notes}</span>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Message d'aide -->
			{#if unassignedCount > 0}
				<div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<div class="flex items-start gap-3">
						<Package class="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
						<div>
							<h4 class="font-medium text-blue-800 mb-1">Assignations manquantes</h4>
							<p class="text-sm text-blue-700">
								{unassignedCount} pièce{unassignedCount !== 1 ? 's' : ''} nécessite{unassignedCount === 1 ? '' : 'nt'}
								encore l'assignation d'un matériel pour ce projet.
							</p>
						</div>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>