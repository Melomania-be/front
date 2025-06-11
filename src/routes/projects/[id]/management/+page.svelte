<script lang="ts">
	import ProjectModifier from '$lib/components/project/ProjectModifier.svelte';
	import type { Project } from '$lib/types/Project';
	import Dashboard from './Dashboard.svelte';
	import ProjectHeadDisplayer from './ProjectHeadDisplayer.svelte';

	export let data;

	let project = data.data[0];
	let participantsNotSeenCallsheet = data.participantsNotSeenCallsheet;
	let participantsNotValidated = data.participantsNotValidated;
	let participantsWithoutEmail = data.participantsWithoutEmail;

	let selectedTab = 0;
</script>

<div class="overflow-x-hidden">
	<ProjectHeadDisplayer project={project} selectedTab={0}></ProjectHeadDisplayer>
	<Dashboard
		{project}
		{participantsNotSeenCallsheet}
		{participantsNotValidated}
		{participantsWithoutEmail}
	/>
</div>
