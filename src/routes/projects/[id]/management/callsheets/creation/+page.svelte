<script lang="ts">
	import { onMount } from 'svelte';
	import type { Callsheet } from '$lib/types/Callsheet';
	import CallsheetShow from '$lib/components/callsheet/CallsheetShow.svelte';
	import { goto } from '$app/navigation';
	import CallsheetModifier from '$lib/components/callsheet/CallsheetModifier.svelte';

	export let data: any;

	let callsheet: Callsheet;

	onMount(async () => {
		const projectResponse = await fetch(`/api/projects/${data.id}`, {
			method: 'GET'
		});

		//if (!projectResponse.ok) goto('/projects');

		let project = await projectResponse.json();

		callsheet = {
			contents: [],
			id: 0,
			project: project,
			version: '',
			projectId: data.id,
			createdAt: new Date(),
			updatedAt: new Date()
		};
	});
</script>

<CallsheetModifier {callsheet} mode="create" />
