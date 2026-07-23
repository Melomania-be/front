<!-- src/lib/components/materials/MaterialSelector.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { ChevronDown, Star, Plus, AlertCircle } from 'lucide-svelte';

	// Correction : Séparation des imports de types
	import type { Material } from '$lib/types/Material';
	import type { Piece } from '$lib/types/Piece';

	import Button from '$lib/components/Button.svelte';

	const dispatch = createEventDispatcher();

	export let piece: Piece;
	export let projectId: number;
	export let selectedMaterialId: number | null = null;
	export let disabled = false;
	export let required = false;

	let materials: Material[] = [];
	let isLoading = true;
	let isOpen = false;
	let selectedMaterial: Material | null = null;

	onMount(async () => {
		await loadMaterials();
		isLoading = false;
	});

	async function loadMaterials() {
		try {
			const response = await fetch(`/api/materials/piece/${piece.id}`);
			if (response.ok) {
				materials = await response.json();

				// Sélectionner le matériel actuel ou par défaut
				if (selectedMaterialId) {
					selectedMaterial = materials.find(m => m.id === selectedMaterialId) || null;
				} else {
					selectedMaterial = materials.find(m => m.is_default) || null;
				}
			}
		} catch (error) {
			console.error('Error loading materials:', error);
		}
	}

	function selectMaterial(material: Material | null) {
		selectedMaterial = material;
		selectedMaterialId = material?.id || null;
		isOpen = false;
		dispatch('materialSelected', material);
	}

	function createNewMaterial() {
		dispatch('createMaterial', piece);
		isOpen = false;
	}

	function toggleDropdown() {
		if (!disabled) {
			isOpen = !isOpen;
		}
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const dropdown = document.getElementById(`material-dropdown-${piece.id}`);
		if (dropdown && !dropdown.contains(target)) {
			isOpen = false;
		}
	}

	$: if (typeof window !== 'undefined') {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
		} else {
			document.removeEventListener('click', handleClickOutside);
		}
	}
</script>