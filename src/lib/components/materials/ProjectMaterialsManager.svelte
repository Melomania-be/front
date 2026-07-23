<!-- src/lib/components/materials/ProjectMaterialsManager.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { Save, AlertCircle, CheckCircle, Music, Plus, Upload, FileText, Download, Eye, Trash2, Edit } from 'lucide-svelte';
	import MaterialSelector from './MaterialSelector.svelte';
	import MaterialEditor from './MaterialEditor.svelte';
	import FileUploader from '../filesystem/FileUploader.svelte';
	import Button from '$lib/components/Button.svelte';

	// CORRECTION 1 : Séparation des types
	import type { Piece } from '$lib/types/Piece';
	import type { Material } from '$lib/types/Material';

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
		} catch (err) {
			// CORRECTION 2 : Caster l'erreur en any
			const error = err as any;
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

	// Charger tous les matériels pour chaque pièce
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
		} catch (err) {
			// CORRECTION 2 : Caster l'erreur en any
			const error = err as any;
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

	// Charger les matériels d'une pièce spécifique
	async function loadMaterialsForPiece(pieceId: number) {
		try {
			const response = await fetch(`/api/materials/piece/${pieceId}`);
			if (response.ok) {
				materialsData[pieceId] = await response.json();
				materialsData = { ...materialsData };
			}
		} catch (err) {
			// CORRECTION 2 : Caster l'erreur en any
			const error = err as any;
			console.error('Error loading materials for piece:', pieceId, error);
		}
	}

	// Ouvrir l'upload pour un matériel
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
		} catch (err) {
			// CORRECTION 2 : Caster l'erreur en any
			const error = err as any;
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
		} catch (err) {
			// CORRECTION 2 : Caster l'erreur en any
			const error = err as any;
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

	// Obtenir le matériel sélectionné pour une pièce
	function getSelectedMaterial(pieceId: number): Material | null {
		const materialId = materialSelections[pieceId];
		if (!materialId || !materialsData[pieceId]) return null;
		return materialsData[pieceId].find(m => m.id === materialId) || null;
	}
</script>