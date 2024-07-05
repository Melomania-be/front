<script lang="ts">
	import type { Project } from '$lib/types/Project';
	import type { SectionGroup } from '$lib/types/SectionGroup';
	import type { Instrument } from '$lib/types/Instrument';
	import type { Piece } from '$lib/types/Piece';
	import ProjectModifier from '$lib/components/project/ProjectModifier.svelte';

	export let data;

	let project: Project = structuredClone(data.project);
	let sectionGroups: Array<SectionGroup> = structuredClone(data.sectionGroups);
	let pieces: Array<Piece> = structuredClone(data.pieces);
</script>

<ProjectModifier mode="modify" {project} {sectionGroups} {pieces} />
