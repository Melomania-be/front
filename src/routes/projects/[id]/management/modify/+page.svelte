<script lang="ts">
	import type { Project } from '$lib/types/Project';
	import type { SectionGroup } from '$lib/types/SectionGroup';
	import type { Piece } from '$lib/types/Piece';
	import ProjectModifier from '$lib/components/project/ProjectModifier.svelte';
	import type { Concert } from '$lib/types/Concert.js';
	import type { Rehearsal } from '$lib/types/Rehearsal.js';
	import type { Folder } from '$lib/types/Folder.js';

	export let data;

	let project: Project = {
		...data.project[0],
		concerts: data.project[0].concerts.map((concert: Concert) => {
			return { ...concert, date: new Date(concert.date) };
		}),
		rehearsals: data.project[0].rehearsals.map((rehearsal: Rehearsal) => {
			return { ...rehearsal, date: new Date(rehearsal.date) };
		})
	};
	let sectionGroups: Array<SectionGroup> = data.sectionGroups;
	let pieces: Array<Piece> = data.pieces;
	let folders: Array<Folder> = data.folders;
</script>

<ProjectModifier mode="modify" {project} {sectionGroups} {pieces} {folders} urlFront={`/projects/${project.id}/management/modify`}/>
