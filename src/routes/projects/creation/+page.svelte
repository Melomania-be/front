<script lang="ts">
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import type { Project } from '$lib/types/Project';
	import { onMount } from 'svelte';
	import ProjectModifier from '$lib/components/project/ProjectModifier.svelte';
	import type { Piece } from '$lib/types/Piece';
	import type { SectionGroup } from '$lib/types/SectionGroup';

	let listPieces: Array<Piece>;
	let listSectionGroups: Array<SectionGroup>;
	let listFolders: Array<any>;

	const project: Project = {
		id: null,
		name: '',
		sectionGroupId: null,
		registrationId: null,
		rehearsals: [],
		pieces: [],
		sectionGroup: null,
		concerts: [],
		responsibles: []
	};

	onMount(async () => {
		let responsePieces = await fetch('/api/pieces', {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(responsePieces, async () => {
			listPieces = await responsePieces.json();
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
	});
</script>

<ProjectModifier
	mode="create"
	{project}
	pieces={listPieces}
	sectionGroups={listSectionGroups}
	folders={listFolders}
	urlFront={`/projects/creation`}
/>
