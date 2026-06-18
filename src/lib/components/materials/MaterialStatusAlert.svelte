<!-- src/lib/components/materials/MaterialStatusAlert.svelte - Version améliorée -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { AlertTriangle, ChevronRight, FileText, RefreshCw } from 'lucide-svelte';

	export let projectId: number;

	let piecesWithoutMaterial: any[] = [];
	let isLoading = true;
	let showDetails = false;
	let isRefreshing = false;

	onMount(async () => {
		await loadUnspecifiedMaterials();
		isLoading = false;

		// Listen for material selection changes
		const handleMaterialChange = () => {
			loadUnspecifiedMaterials();
		};

		window.addEventListener('materialSelectionChanged', handleMaterialChange);

		return () => {
			window.removeEventListener('materialSelectionChanged', handleMaterialChange);
		};
	});

	async function loadUnspecifiedMaterials() {
		try {
			const projectResponse = await fetch(`/api/projects/${projectId}`);
			if (!projectResponse.ok) {
				return;
			}

			const projectData = await projectResponse.json();
			if (!projectData.pieces || projectData.pieces.length === 0) {
				piecesWithoutMaterial = [];
				return;
			}

			const unspecifiedPieces = [];

			for (const piece of projectData.pieces) {
				// Check if there's a direct selection
				try {
					const selectionResponse = await fetch(`/api/pieces/${piece.id}/select-material`);
					let hasSelection = false;

					if (selectionResponse.ok) {
						const selectionData = await selectionResponse.json();
						hasSelection = !!selectionData.materialId;
					}

					if (!hasSelection) {
						unspecifiedPieces.push({
							piece_id: piece.id,
							piece_name: piece.name,
							composer_name: piece.composer?.shortName || piece.composer?.longName || 'Unknown composer'
						});
					}
				} catch (error) {
					// In case of error, consider as unspecified
					unspecifiedPieces.push({
						piece_id: piece.id,
						piece_name: piece.name,
						composer_name: piece.composer?.shortName || piece.composer?.longName || 'Unknown composer'
					});
				}
			}

			piecesWithoutMaterial = unspecifiedPieces;
		} catch (error) {
			piecesWithoutMaterial = [];
		}
	}

	function toggleDetails() {
		showDetails = !showDetails;
	}

	async function refreshStatus() {
		isRefreshing = true;
		await loadUnspecifiedMaterials();
		isRefreshing = false;
	}

	function goToMaterialsManagement() {
		window.location.href = '/files?tab=materials';
	}

	// Only show alert if there are pieces without materials
	$: shouldShowAlert = !isLoading && piecesWithoutMaterial.length > 0;
</script>

{#if shouldShowAlert}
	<div class="mb-6 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-lg shadow-sm">
		<div class="flex items-start">
			<AlertTriangle class="text-orange-400 flex-shrink-0 mt-0.5" size={20} />
			<div class="ml-3 flex-1">
				<div class="flex items-center justify-between">
					<h4 class="text-sm font-medium text-orange-800">
						Material Assignment Required
					</h4>
					<button
						class="p-1 text-orange-600 hover:text-orange-800 rounded transition-colors"
						on:click={refreshStatus}
						disabled={isRefreshing}
						title="Refresh status"
					>
						<RefreshCw class="w-4 h-4 {isRefreshing ? 'animate-spin' : ''}" />
					</button>
				</div>
				<div class="text-sm text-orange-700 mt-1">
					{piecesWithoutMaterial.length} piece{piecesWithoutMaterial.length !== 1 ? 's' : ''}
					{piecesWithoutMaterial.length === 1 ? 'requires' : 'require'} material assignment.
				</div>

				<div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-3">
					{#if piecesWithoutMaterial.length > 0}
						<button
							class="flex items-center gap-1 text-sm text-orange-800 hover:text-orange-900 font-medium"
							on:click={toggleDetails}
						>
							<ChevronRight
								class="transition-transform {showDetails ? 'rotate-90' : ''}"
								size={16}
							/>
							{showDetails ? 'Hide' : 'Show'} details
						</button>
					{/if}

					<button
						class="flex items-center gap-1 px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-800 text-sm rounded-md font-medium transition-colors"
						on:click={goToMaterialsManagement}
					>
						<FileText size={14} />
						Manage Materials
					</button>
				</div>
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
					Use the material management interface to specify which material to use for each piece.
				</div>
			</div>
		{/if}
	</div>
{:else if isLoading}
	<div class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
		<div class="flex items-center">
			<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-3"></div>
			<span class="text-sm text-gray-600">Checking material status...</span>
		</div>
	</div>
{/if}