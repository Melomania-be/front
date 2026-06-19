<!-- src/lib/components/materials/MaterialSelector.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { ChevronDown, Star, Plus, AlertCircle } from 'lucide-svelte';
	import type { Material, Piece } from '$lib/types';

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
					selectedMaterial = materials.find((m) => m.id === selectedMaterialId) || null;
				} else {
					selectedMaterial = materials.find((m) => m.is_default) || null;
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

<div id="material-dropdown-{piece.id}" class="relative">
	<!-- Sélecteur principal -->
	<button
		type="button"
		class="w-full flex items-center justify-between px-3 py-2 border rounded-lg transition-colors {disabled
			? 'bg-gray-100 cursor-not-allowed border-gray-200 text-gray-400'
			: 'bg-white hover:bg-gray-50 border-gray-300 focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent'} {required &&
		!selectedMaterial
			? 'border-red-300 bg-red-50'
			: ''}"
		on:click={toggleDropdown}
		{disabled}
	>
		<div class="flex items-center gap-2 flex-1 min-w-0">
			{#if isLoading}
				<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
				<span class="text-sm text-gray-500">Chargement...</span>
			{:else if selectedMaterial}
				{#if selectedMaterial.is_default}
					<Star class="text-yellow-500 fill-current flex-shrink-0" size={16} />
				{/if}
				<div class="flex-1 min-w-0">
					<div class="text-sm font-medium text-gray-900 truncate">
						{selectedMaterial.name}
					</div>
					{#if selectedMaterial.description}
						<div class="text-xs text-gray-500 truncate">
							{selectedMaterial.description}
						</div>
					{/if}
				</div>
			{:else if materials.length === 0}
				<AlertCircle class="text-orange-500 flex-shrink-0" size={16} />
				<span class="text-sm text-orange-600">Aucun matériel disponible</span>
			{:else}
				<AlertCircle class="text-red-500 flex-shrink-0" size={16} />
				<span class="text-sm text-red-600">Matériel non spécifié</span>
			{/if}
		</div>

		{#if !disabled}
			<ChevronDown
				class="text-gray-400 flex-shrink-0 transition-transform {isOpen ? 'rotate-180' : ''}"
				size={16}
			/>
		{/if}
	</button>

	<!-- Dropdown -->
	{#if isOpen && !disabled}
		<div
			class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
		>
			<!-- Option vide -->
			<button
				type="button"
				class="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 transition-colors {!selectedMaterial
					? 'bg-blue-50 text-blue-700'
					: 'text-gray-700'}"
				on:click={() => selectMaterial(null)}
			>
				<div class="flex-1">
					<div class="text-sm font-medium">Aucun matériel sélectionné</div>
					<div class="text-xs text-gray-500">Choisir plus tard</div>
				</div>
			</button>

			<!-- Séparateur -->
			<div class="border-t border-gray-200"></div>

			<!-- Matériels disponibles -->
			{#each materials as material}
				<button
					type="button"
					class="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 transition-colors {selectedMaterial?.id ===
					material.id
						? 'bg-blue-50 text-blue-700'
						: 'text-gray-700'}"
					on:click={() => selectMaterial(material)}
				>
					<div class="flex items-center gap-2 flex-1 min-w-0">
						{#if material.is_default}
							<Star class="text-yellow-500 fill-current flex-shrink-0" size={14} />
						{/if}
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium truncate">
								{material.name}
							</div>
							{#if material.description}
								<div class="text-xs text-gray-500 truncate">
									{material.description}
								</div>
							{/if}
							<div class="text-xs text-gray-400">
								{material.files_count} fichier{material.files_count !== 1 ? 's' : ''}
								{#if material.edition}
									• {material.edition}
								{/if}
							</div>
						</div>
					</div>
				</button>
			{/each}

			<!-- Séparateur -->
			<div class="border-t border-gray-200"></div>

			<!-- Créer nouveau matériel -->
			<button
				type="button"
				class="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 transition-colors text-[#6B9AD9] hover:text-[#5a9bb4]"
				on:click={createNewMaterial}
			>
				<Plus class="flex-shrink-0 mr-2" size={16} />
				<div class="flex-1">
					<div class="text-sm font-medium">Créer un nouveau matériel</div>
					<div class="text-xs opacity-75">Ajouter un matériel pour cette pièce</div>
				</div>
			</button>
		</div>
	{/if}
</div>

<svelte:window on:beforeunload={() => document.removeEventListener('click', handleClickOutside)} />
