<script lang="ts">
	import type { Project } from '$lib/types/Project';
	import type { SectionGroup } from '$lib/types/SectionGroup';
	import type { Piece } from '$lib/types/Piece';
	import ProjectModifier from '$lib/components/project/ProjectModifier.svelte';
	import { onMount } from 'svelte';

	export let data;

	let project: Project;
	let sectionGroups: Array<SectionGroup>;
	let pieces: Array<Piece>;

	onMount(async () => {
		const projectResponse = await fetch(`/api/projects/${data.id}`, {
			method: 'GET'
		});

		if (projectResponse.ok) {
			let tmp = await projectResponse.json();
			project = tmp[0];
		} else {
			alert('server error')
		}

		const sectionGroupsResponse = await fetch(`/api/sectionGroups`, {
			method: 'GET'
		});

		if (sectionGroupsResponse.ok) {
			sectionGroups = await sectionGroupsResponse.json();
		} else {
			alert('server error')
		}

		const piecesResponse = await fetch(`/api/pieces?filter=&page=1&limit=10000&order=asc&orderBy=id`, {
			method: 'GET'
		});

		if (piecesResponse.ok) {
			pieces = await piecesResponse.json();
		} else {
			alert('server error')
		}
	});
</script>

{#if project && sectionGroups && pieces}
	<ProjectModifier mode="modify" {project} {sectionGroups} {pieces} urlFront={`/projects/${data.id}/management/modify`}/>
{/if}