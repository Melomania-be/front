<script lang="ts">
	import { onMount } from 'svelte';
	import AdvancedFilterer from '$lib/components/AdvancedFilterer.svelte';
	import type { Contact } from '$lib/types/Contact';
	import type { TableData } from '$lib/types/TableData';

	let meta: any;
	let data: TableData<Contact>;
	let columns: any;
	let options: {
		filters: {
			type: string;
			filtersDepth1: {
				type: string;
				filtersDepth2: { relation: string; column: string; operation: string; filter: string }[];
			}[];
		};
		page: number;
		limit: number;
		orderBy: string;
		order: string;
	} = {
		filters: {
			type: 'and',
			filtersDepth1: [
				{
					type: 'and',
					filtersDepth2: []
				}
			]
		},
		page: 1,
		limit: 10,
		orderBy: 'id',
		order: 'asc'
	};

	onMount(async () => {
		fetchData();
	});

	$: console.log(options);
	$: console.log(data);
	$: console.log(meta);

	async function fetchData() {
		let response = await fetch('/test/api', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(options)
		});

		if (response.status >= 400 && response.status < 500) {
			const jsonResponse = await response.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		}

		if (response.ok) {
			const jsonResponse = await response.json();

			data = {
				data: jsonResponse.data.data,
				columns: ['id', 'firstName', 'lastName', 'email', 'messenger', 'phone', 'comments'],
				notOrderedColumns: []
			};
			meta = jsonResponse.data.meta;
			columns = jsonResponse.columns;
		}
	}
</script>

<AdvancedFilterer
	bind:columns
	bind:meta
	bind:data
	bind:options
	uniqueUrl={'/contacts'}
	on:optionsUpdated={() => fetchData()}
	showData
/>
