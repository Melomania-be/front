<script lang="ts">
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import type { Project } from '$lib/types/Project';
	import { onMount } from 'svelte';
	import ProjectModifier from '$lib/components/project/ProjectModifier.svelte';
	import type { Piece } from '$lib/types/Piece';
	import type { SectionGroup } from '$lib/types/SectionGroup';
	import type { Folder } from '$lib/types/Folder';

	let listPieces: Array<Piece>;
	let listSectionGroups: Array<SectionGroup>;
	let listFolders: Array<Folder>;

	const project: Project = {
		id: null,
		name: '',
		sectionGroupId: null,
		rehearsals: [],
		pieces: [],
		sectionGroup: null,
		concerts: [],
		responsibles: []
	};

	onMount(async () => {
		let responsePieces = await fetch(
			'/api/pieces?filter=&page=1&limit=10000&order=asc&orderBy=id',
			{
				method: 'GET'
			}
		);

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(responsePieces, async () => {
			const tmp = await responsePieces.json();
			listPieces = tmp.data
		});

		let responseSectionGroups = await fetch('/api/sectionGroups', {
			method: 'GET'
		});

		responseHandler.handle(responseSectionGroups, async () => {
			listSectionGroups = await responseSectionGroups.json();
		});

		let responseFolder = await fetch('/api/folders', {
			method: 'GET'
		});

		responseHandler.handle(responseFolder, async () => {
			listFolders = await responseFolder.json();
		});

		if (!listFolders) {
			listFolders = [];
		}
	});
</script>

<ProjectModifier
	mode="create"
	{project}
	bind:pieces={listPieces}
	bind:sectionGroups={listSectionGroups}
	bind:folders={listFolders}
	urlFront={`/projects/creation`}
/>
