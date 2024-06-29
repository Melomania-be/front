<script lang="ts">
	import type { Project } from '$lib/types/Project';
	import type { SectionGroup } from '$lib/types/SectionGroup';
	import type { Instrument } from '$lib/types/Instrument';
	import type { Piece } from '$lib/types/Piece';
	import type { Concert } from '$lib/types/Concert';
	import type { Rehearsal } from '$lib/types/Rehearsal';
	import ProjectModifier from '$lib/components/project/ProjectModifier.svelte';
	import DateShow from '$lib/components/DateShow.svelte';

	export let data;

	let project: Project = structuredClone(data.project);
	let sectionGroups: Array<SectionGroup> = structuredClone(data.sectionGroups);
	let instruments: Array<Instrument> = structuredClone(data.instruments);
	let pieces: Array<Piece> = structuredClone(data.pieces);
</script>

<ProjectModifier mode="modify" {project} {sectionGroups} {instruments} {pieces} />
