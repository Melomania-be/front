<!-- src/lib/components/materials/MaterialStatusAlert.svelte - Version améliorée -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { AlertTriangle, ChevronRight, FileText, RefreshCw } from 'lucide-svelte';
	import Button from '$lib/components/Button.svelte';

	export let projectId: number;

	let piecesWithoutMaterial: any[] = [];
	let isLoading = true;
	let showDetails = false;
	let isRefreshing = false;

	// CORRECTION : onMount ne doit pas être async s'il retourne une fonction de cleanup
	onMount(() => {
		// On encapsule l'appel asynchrone ou on utilise .then()
		loadUnspecifiedMaterials().then(() => {
			isLoading = false;
		});

		// Listen for material selection changes
		const handleMaterialChange = () => {
			loadUnspecifiedMaterials();
		};

		window.addEventListener('materialSelectionChanged', handleMaterialChange);

		// Le return (cleanup) est maintenant bien exécuté de manière synchrone
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