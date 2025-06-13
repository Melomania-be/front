<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import ProjectModifier from '$lib/components/project/ProjectModifier.svelte';
	import type { Participant } from '$lib/types/Participant';
	import type { Project } from '$lib/types/Project';
	import type { TableData } from '$lib/types/TableData';
	import { onMount } from 'svelte';
	import Dashboard from './Dashboard.svelte';
	import ProjectHeadDisplayer from './ProjectHeadDisplayer.svelte';

	export let data;

	let project = data.data[0];
	let participantsNotSeenCallsheet = data.participantsNotSeenCallsheet;
	let participantsNotValidated = data.participantsNotValidated;
	let participantsWithoutEmail = data.participantsWithoutEmail;

	let selectedTab = 0;


	let allParticipants : Participant[] = [];

	let urlSvelteApi = `/api/projects/${project.id}/management/participants`;
	let urlFront = `/projects/${project.id}/management/participants`;
	let uniqueUrl = `/projects/${project.id}/management/participants`;

	let options: any = {
		filter: '',
		limit: 250,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};

	onMount(async () => {
		await fetchData();
	});

	async function fetchData() {
		let optionInUrls = `?page=${options.page}&limit=${options.limit}`;
		optionInUrls += '&filter=' + options.filter;
		optionInUrls += '&orderBy=' + options.orderBy;
		optionInUrls += '&order=' + options.order;

		const response = await fetch(`${urlSvelteApi}${optionInUrls}`, {
			method: 'GET'
		});

		const data = await response.json();

		allParticipants = data.data;
	}
</script>

<div class="">
	<ProjectHeadDisplayer project={project} selectedTab={0}></ProjectHeadDisplayer>
	<Dashboard
		{project}
		participants={allParticipants}
		{participantsNotSeenCallsheet}
		participantsNotValidated={participantsNotValidated}
		{participantsWithoutEmail}
	/>
</div>
