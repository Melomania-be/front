<script lang="ts">
	import type { Project } from '$lib/types/Project';
	import type { SectionGroup } from '$lib/types/SectionGroup';
	import type { Piece } from '$lib/types/Piece';
	import ProjectModifier from '$lib/components/project/ProjectModifier.svelte';
	import { onMount } from 'svelte';
	import type { Folder } from '$lib/types/Folder.js';
	import type { Rehearsal } from '$lib/types/Rehearsal.js';

	export let data;

	let project: Project;
	let sectionGroups: Array<SectionGroup>;
	let pieces: Array<Piece>;
	let folders: Array<Folder>;

	function buildLocalDate(date: string, time: string) {
	    return new Date(`${date}T${time}:00`);
    }

    function getDatePart(value: string | Date) {
	    const raw = String(value);
	    return raw.includes('T') ? raw.split('T')[0] : raw;
    }

    function getTimePart(value: string | Date) {
	    const raw = String(value);
	    return raw.includes('T') ? raw.split('T')[1]?.slice(0, 5) : '00:00';
    }

	onMount(async () => {
		const projectResponse = await fetch(`/api/projects/${data.id}`, {
			method: 'GET'
		});

		if (projectResponse.ok) {
			let tmp = await projectResponse.json();
			project = {
				...tmp,
                rehearsals: tmp.rehearsals.map((r: any) => {
					const date = r.date || getDatePart(r.startDate);
					const startTime = r.startTime || getTimePart(r.startDate);
					const endTime = r.endTime || getTimePart(r.endDate);
                    return { 
                        ...r, 
                        startDate: buildLocalDate(date, startTime),
                        endDate: endTime ? buildLocalDate(date, endTime) : null 
                    };
                }),
                concerts: tmp.concerts.map((c: any) => {
					const date = c.date || getDatePart(c.startDate);
					const startTime = c.startTime || getTimePart(c.startDate);
					const endTime = c.endTime || getTimePart(c.endDate);
                    return { 
                        ...c, 
                        startDate: buildLocalDate(date, startTime),
                        endDate: endTime ? buildLocalDate(date, endTime) : null 
                    };
                })
			};
		} else {
			alert('server error');
		}

		const sectionGroupsResponse = await fetch(`/api/sectionGroups`, {
			method: 'GET'
		});

		if (sectionGroupsResponse.ok) {
			sectionGroups = await sectionGroupsResponse.json();
		} else {
			alert('server error');
		}

		const piecesResponse = await fetch(
			`/api/pieces?filter=&page=1&limit=10000&order=asc&orderBy=id`,
			{
				method: 'GET'
			}
		);

		if (piecesResponse.ok) {
			const tmp = await piecesResponse.json();
			pieces = tmp.data;
		} else {
			alert('server error');
		}

		const foldersResponse = await fetch(`/api/folders`, {
			method: 'GET'
		});

		if (foldersResponse.ok) {
			folders = await foldersResponse.json();
		} else {
			alert('server error');
		}
	});
</script>

{#if project && sectionGroups && pieces}
	<ProjectModifier
		mode="modify"
		{project}
		{sectionGroups}
		{pieces}
		{folders}
		urlFront={`/projects/${data.id}/management/modify`}
	/>
{/if}
