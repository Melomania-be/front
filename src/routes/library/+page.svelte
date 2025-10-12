<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Music } from 'lucide-svelte';
	import ModuleHeader from '$lib/components/ModuleHeader.svelte';

	let composers: any[] = [];
	let pieces: any[] = [];
	let typeOfPieces: any[] = [];
	let loading = true;

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		try {
			const composersResponse = await fetch('/api/composers?page=1&limit=250&filter=&orderBy=id&order=asc');
			if (composersResponse.ok) {
				const composersData = await composersResponse.json();
				console.log('Composers response:', composersData);
				// L'API retourne directement un objet avec data et meta
				if (composersData.data) {
					composers = composersData.data;
				} else if (Array.isArray(composersData)) {
					composers = composersData;
				}
				console.log('Composers array:', composers);
			}

			const piecesResponse = await fetch('/api/pieces?page=1&limit=250&filter=&orderBy=id&order=asc');
			if (piecesResponse.ok) {
				const piecesData = await piecesResponse.json();
				console.log('Pieces response:', piecesData);
				if (piecesData.data) {
					pieces = piecesData.data;
				} else if (Array.isArray(piecesData)) {
					pieces = piecesData;
				}
				console.log('Pieces array:', pieces);
			}

			const typesResponse = await fetch('/api/type_of_pieces?page=1&limit=250&filter=&orderBy=id&order=asc');
			if (typesResponse.ok) {
				const typesData = await typesResponse.json();
				console.log('Types response:', typesData);
				if (typesData.data) {
					typeOfPieces = typesData.data;
				} else if (Array.isArray(typesData)) {
					typeOfPieces = typesData;
				}
				console.log('Types array:', typeOfPieces);
			}
		} catch (error) {
			console.error('Error loading library data:', error);
		} finally {
			loading = false;
		}
	}

	function viewComposer(composer: any) {
		// Encode l'objet composer en JSON puis en base64 pour le passer dans l'URL
		const encodedComposer = encodeURIComponent(JSON.stringify(composer));
		goto(`/library/composers?page=1&limit=250&filter=&orderBy=id&order=asc&selected=${encodedComposer}`);
	}

	function viewPiece(piece: any) {
		const encodedPiece = encodeURIComponent(JSON.stringify(piece));
		goto(`/library/pieces?page=1&limit=250&filter=&orderBy=id&order=asc&selected=${encodedPiece}`);
	}

	function viewType(type: any) {
		const encodedType = encodeURIComponent(JSON.stringify(type));
		goto(`/library/type_of_pieces?page=1&limit=250&filter=&orderBy=id&order=asc&selected=${encodedType}`);
	}
</script>

<svelte:head>
	<title>Music Library - Melomania</title>
</svelte:head>

<div class="bg-[#E7E7E7] min-h-screen">
	<ModuleHeader
		title="Music Library"
		description="Manage composers, pieces and categories"
		icon={Music}
		on:refresh={() => loadData()}
	/>

	<div class="p-8">
	{#if loading}
		<div class="flex items-center justify-center min-h-[400px]">
			<div class="text-center">
				<div class="animate-spin rounded-full h-16 w-16 border-b-2 border-[#6B9AD9] mx-auto mb-4"></div>
				<p class="text-gray-600">Loading library...</p>
			</div>
		</div>
	{:else}
		<!-- Composers Section -->
		<div class="bg-white border-2 border-gray-400 rounded-xl p-4 mb-4">
			<div class="flex items-center justify-between mb-4">
				<h2 class="uppercase font-bold text-gray-800">Composers</h2>
				<a
					href="/library/composers?page=1&limit=250&filter=&orderBy=id&order=asc"
					class="bg-[#6B9AD9] px-4 py-2 rounded-lg text-sm hover:bg-blue-700 text-white font-semibold"
				>
					View All ({composers.length})
				</a>
			</div>

			{#if composers.length === 0}
				<div class="text-center py-8 text-gray-500">
					<p class="mb-2">No composers yet</p>
					<a
						href="/library/composers?page=1&limit=250&filter=&orderBy=id&order=asc"
						class="text-[#6B9AD9] hover:underline font-semibold"
					>
						Add your first composer
					</a>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="border-b-2 border-gray-300">
							<tr class="text-left">
								<th class="p-3 font-semibold text-gray-700 uppercase text-sm">Name</th>
								<th class="p-3 font-semibold text-gray-700 uppercase text-sm">Nationality</th>
								<th class="p-3 font-semibold text-gray-700 uppercase text-sm">Birth Year</th>
								<th class="p-3 font-semibold text-gray-700 uppercase text-sm w-20 text-center">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each composers.slice(0, 10) as composer}
								<tr class="border-b border-gray-200 hover:bg-gray-50">
									<td class="p-3 text-gray-900">{composer.longName || composer.shortName || '-'}</td>
									<td class="p-3 text-gray-600">{composer.country || '-'}</td>
									<td class="p-3 text-gray-600">{composer.birthDate ? new Date(composer.birthDate).getFullYear() : '-'}</td>
									<td class="p-3 text-center">
										<button
											on:click={() => viewComposer(composer)}
											class="text-blue-700 hover:text-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2"
										>
											<span class="icon-[formkit--arrowright] hover:text-black"></span>
										</button>
									</td>
								</tr>
							{/each}
							{#if composers.length > 10}
								<tr>
									<td colspan="4" class="p-3 text-center">
										<a
											href="/library/composers?page=1&limit=250&filter=&orderBy=id&order=asc"
											class="text-[#6B9AD9] hover:underline font-semibold"
										>
											View {composers.length - 10} more composer(s)
										</a>
									</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<!-- Musical Pieces Section -->
		<div class="bg-white border-2 border-gray-400 rounded-xl p-4 mb-4">
			<div class="flex items-center justify-between mb-4">
				<h2 class="uppercase font-bold text-gray-800">Musical Pieces</h2>
				<a
					href="/library/pieces?page=1&limit=250&filter=&orderBy=id&order=asc"
					class="bg-[#6B9AD9] px-4 py-2 rounded-lg text-sm hover:bg-blue-700 text-white font-semibold"
				>
					View All ({pieces.length})
				</a>
			</div>

			{#if pieces.length === 0}
				<div class="text-center py-8 text-gray-500">
					<p class="mb-2">No pieces yet</p>
					<a
						href="/library/pieces?page=1&limit=250&filter=&orderBy=id&order=asc"
						class="text-[#6B9AD9] hover:underline font-semibold"
					>
						Add your first piece
					</a>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="border-b-2 border-gray-300">
							<tr class="text-left">
								<th class="p-3 font-semibold text-gray-700 uppercase text-sm">Title</th>
								<th class="p-3 font-semibold text-gray-700 uppercase text-sm">Composer</th>
								<th class="p-3 font-semibold text-gray-700 uppercase text-sm">Type</th>
								<th class="p-3 font-semibold text-gray-700 uppercase text-sm w-20 text-center">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each pieces.slice(0, 10) as piece}
								<tr class="border-b border-gray-200 hover:bg-gray-50">
									<td class="p-3 text-gray-900">{piece.name || '-'}</td>
									<td class="p-3 text-gray-600">{piece.composer?.longName || piece.composer?.shortName || '-'}</td>
									<td class="p-3 text-gray-600">{piece.typeOfPiece?.name || '-'}</td>
									<td class="p-3 text-center">
										<button
											on:click={() => viewPiece(piece)}
											class="text-blue-700 hover:text-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2"
										>
											<span class="icon-[formkit--arrowright] hover:text-black"></span>
										</button>
									</td>
								</tr>
							{/each}
							{#if pieces.length > 10}
								<tr>
									<td colspan="4" class="p-3 text-center">
										<a
											href="/library/pieces?page=1&limit=250&filter=&orderBy=id&order=asc"
											class="text-[#6B9AD9] hover:underline font-semibold"
										>
											View {pieces.length - 10} more piece(s)
										</a>
									</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<!-- Types of Pieces Section -->
		<div class="bg-white border-2 border-gray-400 rounded-xl p-4">
			<div class="flex items-center justify-between mb-4">
				<h2 class="uppercase font-bold text-gray-800">Types of Pieces</h2>
				<a
					href="/library/type_of_pieces?page=1&limit=250&filter=&orderBy=id&order=asc"
					class="bg-[#6B9AD9] px-4 py-2 rounded-lg text-sm hover:bg-blue-700 text-white font-semibold"
				>
					View All ({typeOfPieces.length})
				</a>
			</div>

			{#if typeOfPieces.length === 0}
				<div class="text-center py-8 text-gray-500">
					<p class="mb-2">No categories yet</p>
					<a
						href="/library/type_of_pieces?page=1&limit=250&filter=&orderBy=id&order=asc"
						class="text-[#6B9AD9] hover:underline font-semibold"
					>
						Add your first category
					</a>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="border-b-2 border-gray-300">
							<tr class="text-left">
								<th class="p-3 font-semibold text-gray-700 uppercase text-sm">Name</th>
								<th class="p-3 font-semibold text-gray-700 uppercase text-sm text-right">Pieces Count</th>
								<th class="p-3 font-semibold text-gray-700 uppercase text-sm w-20 text-center">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each typeOfPieces.slice(0, 10) as type}
								<tr class="border-b border-gray-200 hover:bg-gray-50">
									<td class="p-3 text-gray-900">{type.name || '-'}</td>
									<td class="p-3 text-gray-600 text-right">
										{pieces.filter(p => p.typeOfPiece?.id === type.id).length}
									</td>
									<td class="p-3 text-center">
										<button
											on:click={() => viewType(type)}
											class="text-blue-700 hover:text-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2"
										>
											<span class="icon-[formkit--arrowright] hover:text-black"></span>
										</button>
									</td>
								</tr>
							{/each}
							{#if typeOfPieces.length > 10}
								<tr>
									<td colspan="3" class="p-3 text-center">
										<a
											href="/library/type_of_pieces?page=1&limit=250&filter=&orderBy=id&order=asc"
											class="text-[#6B9AD9] hover:underline font-semibold"
										>
											View {typeOfPieces.length - 10} more categor{typeOfPieces.length - 10 > 1 ? 'ies' : 'y'}
										</a>
									</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
	</div>
</div>
