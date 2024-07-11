<script lang="ts">
	import type { Project } from '$lib/types/Project';
	import Dashboard from './Dashboard.svelte';

	export let data;

	let project = data.data[0];
    let participantsNotSeenCallsheet = data.participantsNotSeenCallsheet;
    let participantsNotValidated = data.participantsNotValidated;
    let participantsWithoutEmail = data.participantsWithoutEmail;

    console.log('project', project);
    console.log('participantsNotSeenCallsheet', participantsNotSeenCallsheet);
    console.log('participantsNotValidated', participantsNotValidated);
    console.log('participantsWithoutEmail', participantsWithoutEmail);
</script>

<div>
    <h1 class="text-2xl font-bold">{project.name}</h1>
    <Dashboard {project} {participantsNotSeenCallsheet} {participantsNotValidated} {participantsWithoutEmail}/>
</div>