<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { Composer } from '$lib/types/Composer';
	import type { Folder } from '$lib/types/Folder';
	import type { Piece } from '$lib/types/Piece';
	import type { TypeOfPiece } from '$lib/types/TypeOfPiece';

	const dispatch = createEventDispatcher<{
		close: void;
		created: { piece: Piece };
	}>();

	const baseListQuery = '?page=1&limit=10000&filter=&orderBy=id&order=asc';

	let composers: Composer[] = [];
	let typesOfPiece: TypeOfPiece[] = [];
	let folders: Folder[] = [];
	let loading = true;
	let saving = false;
	let errorMessage = '';

	let form = {
		name: '',
		opus: '',
		arranger: '',
		yearOfComposition: '',
		composer: null as Composer | null,
		typeOfPiece: null as TypeOfPiece | null,
		folder: null as Folder | null
	};

	onMount(async () => {
		try {
			await Promise.all([fetchComposers(), fetchTypesOfPiece(), fetchFolders()]);
		} catch (error) {
			console.error('Error loading piece modal data:', error);
			errorMessage = 'Unable to load the required data.';
		} finally {
			loading = false;
		}
	});

	async function fetchComposers() {
		const response = await fetch(`/api/composers${baseListQuery}`, { method: 'GET' });
		if (!response.ok) throw new Error('Unable to load composers');
		const data = await response.json();
		composers = data.data ?? [];
	}

	async function fetchTypesOfPiece() {
		const response = await fetch(`/api/type_of_pieces${baseListQuery}`, { method: 'GET' });
		if (!response.ok) throw new Error('Unable to load piece types');
		const data = await response.json();
		typesOfPiece = data.data ?? [];
	}

	async function fetchFolders() {
		const response = await fetch('/api/folders', { method: 'GET' });
		if (!response.ok) throw new Error('Unable to load folders');
		folders = await response.json();
	}

	async function savePiece() {
		if (!form.name || !form.opus || !form.yearOfComposition || !form.composer || !form.typeOfPiece) {
			errorMessage = 'Please fill in all required fields.';
			return;
		}

		saving = true;
		errorMessage = '';

		try {
			const payload = {
				arranger: form.arranger || null,
				composer_id: Number(form.composer.id),
				folder_id: form.folder ? Number(form.folder.id) : null,
				name: form.name,
				opus: form.opus,
				type_of_piece_id: Number(form.typeOfPiece.id),
				year_of_composition: form.yearOfComposition
			};

			const response = await fetch('/api/pieces', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				errorMessage = errorData?.errors?.[0]?.message || errorData?.message || 'Error while creating the piece.';
				return;
			}

			const piece: Piece = await response.json();
			dispatch('created', { piece });
		} catch (error) {
			console.error('Error creating piece:', error);
			errorMessage = 'Error while creating the piece.';
		} finally {
			saving = false;
		}
	}

	function closeModal() {
		if (!saving) {
			dispatch('close');
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
	<div class="w-full max-w-3xl rounded-xl bg-white shadow-xl">
		<div class="flex items-center justify-between border-b px-6 py-4">
			<div>
				<h3 class="text-lg font-bold uppercase text-gray-900">Add Piece</h3>
				<p class="text-sm text-gray-600">Create a piece and add it directly to the project.</p>
			</div>
			<button type="button" on:click={closeModal} class="rounded-md px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100" disabled={saving}>
				Close
			</button>
		</div>

		<div class="space-y-4 px-6 py-5">
			{#if loading}
				<p class="text-sm text-gray-600">Loading data...</p>
			{:else}
				<div class="grid gap-4 md:grid-cols-2">
					<div>
						<label for="project-piece-name" class="mb-1 block text-sm font-medium text-gray-900">Piece name *</label>
						<input id="project-piece-name" bind:value={form.name} class="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-[#6B9AD9]" />
					</div>
					<div>
						<label for="project-piece-opus" class="mb-1 block text-sm font-medium text-gray-900">Opus *</label>
						<input id="project-piece-opus" bind:value={form.opus} class="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-[#6B9AD9]" />
					</div>
					<div>
						<label for="project-piece-arranger" class="mb-1 block text-sm font-medium text-gray-900">Arranger</label>
						<input id="project-piece-arranger" bind:value={form.arranger} class="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-[#6B9AD9]" />
					</div>
					<div>
						<label for="project-piece-year" class="mb-1 block text-sm font-medium text-gray-900">Year of composition *</label>
						<input id="project-piece-year" bind:value={form.yearOfComposition} class="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-[#6B9AD9]" />
					</div>
					<div>
						<label for="project-piece-composer" class="mb-1 block text-sm font-medium text-gray-900">Composer *</label>
						<select id="project-piece-composer" bind:value={form.composer} class="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-[#6B9AD9]">
							<option value={null}>Choose a composer</option>
							{#each composers as composer}
								<option value={composer}>{composer.longName}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="project-piece-type" class="mb-1 block text-sm font-medium text-gray-900">Piece type *</label>
						<select id="project-piece-type" bind:value={form.typeOfPiece} class="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-[#6B9AD9]">
							<option value={null}>Choose a type</option>
							{#each typesOfPiece as typeOfPiece}
								<option value={typeOfPiece}>{typeOfPiece.name}</option>
							{/each}
						</select>
					</div>
					<div class="md:col-span-2">
						<label for="project-piece-folder" class="mb-1 block text-sm font-medium text-gray-900">Folder</label>
						<select id="project-piece-folder" bind:value={form.folder} class="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-[#6B9AD9]">
							<option value={null}>None</option>
							{#each folders as folder}
								<option value={folder}>{folder.name}</option>
							{/each}
						</select>
					</div>
				</div>

				{#if errorMessage}
					<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{errorMessage}
					</div>
				{/if}
			{/if}
		</div>

		<div class="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
			<button type="button" on:click={closeModal} class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" disabled={saving}>
				Cancel
			</button>
			<button type="button" on:click={savePiece} class="rounded-lg bg-[#6B9AD9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4f7cb7] disabled:opacity-60" disabled={loading || saving}>
				{saving ? 'Creating...' : 'Create piece'}
			</button>
		</div>
	</div>
</div>
