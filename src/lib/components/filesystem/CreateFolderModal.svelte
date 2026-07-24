<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { FolderPlus, Link, Music, X } from 'lucide-svelte';
	import type { Project } from '$lib/types/Project';

	export let projects: Project[] = [];
	export let currentProject: Project | null = null;
	export let defaultProjectId: number | null = null;
	export let defaultPieceId: number | null = null;
	export let lockProject = false;

	const dispatch = createEventDispatcher();

	let folderName = '';
	let selectedProjectId = '';
	let selectedPieceId = '';
	let initialized = false;

	$: availableProjects = currentProject
		? [currentProject]
		: projects.filter((project) => project.id !== null);
	$: selectedProject =
		availableProjects.find((project) => String(project.id) === selectedProjectId) || null;
	$: availablePieces = selectedProject?.pieces || [];

	$: if (!initialized) {
		const initialProjectId = currentProject?.id ?? defaultProjectId;
		selectedProjectId = initialProjectId ? String(initialProjectId) : '';
		selectedPieceId = defaultPieceId ? String(defaultPieceId) : '';
		initialized = true;
	}

	$: if (
		selectedPieceId &&
		!availablePieces.some((piece) => String(piece.id) === selectedPieceId)
	) {
		selectedPieceId = '';
	}

	function submit() {
		const name = folderName.trim();
		if (!name) return;

		const folderData: { name: string; projectId?: number; pieceId?: number } = { name };

		if (selectedProjectId) {
			folderData.projectId = Number(selectedProjectId);
		}

		if (selectedPieceId) {
			folderData.pieceId = Number(selectedPieceId);
		}

		dispatch('create', folderData);
	}

	function cancel() {
		dispatch('cancel');
	}
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
	<form
		class="bg-[#E7E7E7] rounded-[10px] shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden"
		on:submit|preventDefault={submit}
	>
		<div class="bg-white border-2 border-[#8C8C8C] rounded-t-[10px] p-4 flex-shrink-0">
			<div class="flex items-center justify-between gap-4">
				<div class="flex items-center gap-3 min-w-0">
					<div
						class="w-10 h-10 bg-[#6B9AD9] rounded-[8px] flex items-center justify-center flex-shrink-0"
					>
						<FolderPlus size={20} class="text-white" />
					</div>
					<div class="min-w-0">
						<h1 class="font-bold text-lg">NEW FOLDER</h1>
						<p class="text-sm text-gray-600 truncate">Create and link a folder</p>
					</div>
				</div>
				<button
					type="button"
					class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-300 transition-colors"
					on:click={cancel}
					title="Close"
				>
					<X size={20} />
				</button>
			</div>
		</div>

		<div class="flex-1 overflow-y-auto p-4 space-y-4">
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4 space-y-4">
				<label class="block">
					<span class="block text-sm font-semibold text-gray-700 mb-2">Folder name</span>
					<input
						type="text"
						bind:value={folderName}
						class="block w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm focus:border-[#6B9AD9] focus:outline-none"
						placeholder="Folder name"
					/>
				</label>

				<label class="block">
					<span class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
						<Link size={16} />
						Project
					</span>
					<select
						bind:value={selectedProjectId}
						disabled={lockProject}
						on:change={() => (selectedPieceId = '')}
						class="block w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm bg-white focus:border-[#6B9AD9] focus:outline-none disabled:bg-gray-100 disabled:text-gray-600"
					>
						{#if !lockProject}
							<option value="">No project</option>
						{/if}
						{#each availableProjects as project}
							<option value={String(project.id)}>{project.name}</option>
						{/each}
					</select>
				</label>

				<label class="block">
					<span class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
						<Music size={16} />
						Piece
					</span>
					<select
						bind:value={selectedPieceId}
						disabled={!selectedProjectId || availablePieces.length === 0}
						class="block w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm bg-white focus:border-[#6B9AD9] focus:outline-none disabled:bg-gray-100 disabled:text-gray-600"
					>
						<option value="">No piece</option>
						{#each availablePieces as piece}
							<option value={String(piece.id)}>{piece.name}</option>
						{/each}
					</select>
				</label>
			</div>
		</div>

		<div class="bg-white border-2 border-[#8C8C8C] rounded-b-[10px] p-4 flex-shrink-0 border-t-0">
			<div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
				<button
					type="button"
					class="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-300 transition-colors font-semibold"
					on:click={cancel}
				>
					Cancel
				</button>
				<button
					type="submit"
					class="px-6 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 border-2 border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
					disabled={!folderName.trim()}
				>
					Create folder
				</button>
			</div>
		</div>
	</form>
</div>
