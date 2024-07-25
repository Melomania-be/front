<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import DateShow from '$lib/components/DateShow.svelte';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import type { Participant } from '$lib/types/Participant';
	import type { TableData } from '$lib/types/TableData';
	import { onMount } from 'svelte';

	export let data;

	let participants: Participant[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 10,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};

	let urlSvelteApi = `/api/projects/${data.id}/management/participants`;
	let urlFront = `/projects/${data.id}/management/participants`;
	let uniqueUrl = `/projects/${data.id}/management/participants`;

	let dataHolder: TableData<Participant>;

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);

		options = {
			filter: urlParams.get('filter') || '',
			limit: parseInt(urlParams.get('limit') || '5'),
			page: parseInt(urlParams.get('page') || '1'),
			order: urlParams.get('order') || 'asc',
			orderBy: urlParams.get('orderBy') || 'id'
		};

		fetchData();
	});

	async function fetchData() {
		let optionInUrls = `?page=${options.page}&limit=${options.limit}`;
		optionInUrls += '&filter=' + options.filter;
		optionInUrls += '&orderBy=' + options.orderBy;
		optionInUrls += '&order=' + options.order;

		if (browser && data.id) goto(`${urlFront}${optionInUrls}`);

		const response = await fetch(`${urlSvelteApi}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			const data = await response.json();

			participants = data.data;
			meta = data.meta;

			dataHolder = {
				data: participants,
				columns: ['id', 'updatedAt', 'lastActivity'],
				notOrderedColumns: []
			};
		});
	}
</script>

<SimpleFilterer
	bind:data={dataHolder}
	bind:meta
	bind:options
	bind:uniqueUrl
	on:optionsUpdated={fetchData}
>
	<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
		<thead class="text-xs text-gray-700 uppercase dark:text-gray-400">
			<tr>
				<th>First name</th>
				<th>Last name</th>
				<th>Email</th>
				<th>Phone</th>
				<th>Messenger</th>
				<th>Section</th>
				<th>Last activity</th>
				<th>Updated at</th>
			</tr>
		</thead>
		<tbody>
			{#each participants as participant}
				<tr
					on:click={() => goto(uniqueUrl + `/${participant.id}`)}
					class="cursor-pointer hover:border border-black"
				>
					<td>{participant.contact.firstName}</td>
					<td>{participant.contact.lastName}</td>
					<td>{participant.contact.email}</td>
					<td>{participant.contact.phone}</td>
					<td>{participant.contact.messenger}</td>
					<td>{participant.section.name}</td>
					<td><DateShow bind:date={participant.lastActivity} /></td>
					<td><DateShow bind:date={participant.updatedAt} /></td>
				</tr>
			{/each}
		</tbody>
	</table>
</SimpleFilterer>

<button on:click={() => goto(`${urlFront}/creation`)}>Add a participant</button>
