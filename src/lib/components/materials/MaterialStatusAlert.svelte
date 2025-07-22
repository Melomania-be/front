<!-- src/lib/components/materials/MaterialStatusAlert.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { AlertTriangle, ChevronRight, FileText } from 'lucide-svelte';

	export let projectId: number;

	let piecesWithoutMaterial: any[] = [];
	let isLoading = true;
	let showDetails = false;

	onMount(async () => {
		await loadUnspecifiedMaterials();
		isLoading = false;
	});

	async function loadUnspecifiedMaterials() {
		try {
			const response = await fetch(`/api/materials/project/${projectId}/unspecified`);
			if (response.ok) {
				piecesWithoutMaterial = await response.json();
			}
		} catch (error) {
			console.error('Error loading unspecified materials:', error);
		}
	}

	function toggleDetails() {
		showDetails = !showDetails;
	}
</script>

{#if !isLoading && piecesWithoutMaterial.length > 0}
	<div class="mb-6 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-lg">
		<div class="flex items-start">
			<AlertTriangle class="text-orange-400 flex-shrink-0 mt-0.5" size={20} />
			<div class="ml-3 flex-1">
				<h4 class="text-sm font-medium text-orange-800">
					Matériels non spécifiés
				</h4>
				<div class="text-sm text-orange-700 mt-1">
					{piecesWithoutMaterial.length} pièce{piecesWithoutMaterial.length !== 1 ? 's' : ''}
					{piecesWithoutMaterial.length === 1 ? 'nécessite' : 'nécessitent'}
					la spécification d'un matériel.
				</div>

				{#if piecesWithoutMaterial.length > 0}
					<button
						class="flex items-center gap-1 mt-2 text-sm text-orange-800 hover:text-orange-900 font-medium"
						on:click={toggleDetails}
					>
						<ChevronRight
							class="transition-transform {showDetails ? 'rotate-90' : ''}"
							size={16}
						/>
						{showDetails ? 'Masquer' : 'Voir'} les détails
					</button>
				{/if}
			</div>
		</div>

		{#if showDetails}
			<div class="mt-4 pl-8">
				<div class="space-y-2">
					{#each piecesWithoutMaterial as piece}
						<div class="flex items-center gap-2 text-sm">
							<FileText class="text-orange-500 flex-shrink-0" size={16} />
							<div class="flex-1">
								<span class="font-medium text-gray-900">{piece.piece_name}</span>
								{#if piece.composer_name}
									<span class="text-gray-600">- {piece.composer_name}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<div class="mt-3 text-xs text-orange-700">
					Rendez-vous dans la section "Fichiers" du projet pour spécifier les matériels.
				</div>
			</div>
		{/if}
	</div>
{/if}