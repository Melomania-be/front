<!-- src/lib/components/materials/MaterialManager.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	// Correction 2 : Ajout du 'X' manquant dans l'import
	import { Plus, Edit3, Trash2, Copy, Star, Upload, Download, FileText, Eye, BarChart3, Users, FolderOpen, CloudUpload, X } from 'lucide-svelte';

	// Correction 1 : Séparation des imports de types
	import type { Material } from '$lib/types/Material';
	import type { Piece } from '$lib/types/Piece';

	import MaterialEditor from './MaterialEditor.svelte';
	import FileUploader from '../filesystem/FileUploader.svelte';
	import Button from '$lib/components/Button.svelte';

	const dispatch = createEventDispatcher();

	export let piece: Piece;
	export let projectId: number | null = null;
	export let canEdit = true;

	let materials: Material[] = [];
	let selectedMaterial: Material | null = null;
	let showEditor = false;
	let showUploader = false;
	let isLoading = true;
	let editMode: 'create' | 'edit' | 'duplicate' = 'create';

	onMount(async () => {
		await loadMaterials();
		isLoading = false;
	});

	async function loadMaterials() {
		try {
			const response = await fetch(`/api/materials/piece/${piece.id}`);
			if (response.ok) {
				materials = await response.json();
			}
		} catch (error) {
			console.error('Error loading materials:', error);
		}
	}

	function openEditor(mode: 'create' | 'edit' | 'duplicate', material: Material | null = null) {
		editMode = mode;
		selectedMaterial = material;
		showEditor = true;
	}

	async function handleMaterialSaved(event: CustomEvent) {
		await loadMaterials();
		showEditor = false;
		selectedMaterial = null;
		dispatch('materialsUpdated');
	}

	async function deleteMaterial(material: Material) {
		if (!confirm(`Êtes-vous sûr de vouloir supprimer le matériel "${material.name}" ?`)) {
			return;
		}

		try {
			const response = await fetch(`/api/materials/${material.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadMaterials();
				dispatch('materialsUpdated');
			} else {
				const error = await response.json();
				alert(error.message || 'Erreur lors de la suppression');
			}
		} catch (error) {
			console.error('Error deleting material:', error);
			alert('Erreur lors de la suppression du matériel');
		}
	}

	async function setAsDefault(material: Material) {
		try {
			const response = await fetch(`/api/materials/${material.id}/set-default`, {
				method: 'POST'
			});

			if (response.ok) {
				await loadMaterials();
				dispatch('materialsUpdated');
			}
		} catch (error) {
			console.error('Error setting default material:', error);
		}
	}

	async function assignToProject(material: Material) {
		if (!projectId) return;

		try {
			const response = await fetch(`/api/materials/assign`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					projectId,
					pieceId: piece.id,
					materialId: material.id
				})
			});

			if (response.ok) {
				dispatch('materialAssigned', material);
			}
		} catch (error) {
			console.error('Error assigning material:', error);
		}
	}

	function openUploader(material: Material) {
		selectedMaterial = material;
		showUploader = true;
		console.log('📤 Opening uploader for material:', material.name);
	}

	async function handleFileUpload(files: FileList) {
		if (!selectedMaterial) return;

		console.log('📤 Uploading files to material:', selectedMaterial.name);
		console.log('📂 Files to upload:', Array.from(files).map(f => f.name));

		const formData = new FormData();
		Array.from(files).forEach(file => {
			formData.append('files', file);
		});

		try {
			const response = await fetch(`/api/materials/${selectedMaterial.id}/files`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				console.log('✅ Upload successful!');
				await loadMaterials();
				showUploader = false;
				selectedMaterial = null;
			} else {
				console.error('❌ Upload failed:', response.status);
				const error = await response.json();
				alert('Erreur lors de l\'upload: ' + (error.message || 'Erreur inconnue'));
			}
		} catch (error) {
			console.error('❌ Upload error:', error);
			alert('Erreur lors de l\'upload des fichiers');
		}
	}

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	// Calculer les statistiques
	$: totalFiles = materials.reduce((sum, material) => sum + (material.files_count || 0), 0);
	$: totalProjects = materials.reduce((sum, material) => sum + (material.projects_count || 0), 0);
	$: defaultMaterial = materials.find(m => m.is_default);
</script>