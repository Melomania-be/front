<script lang="ts" generics="DataType extends GenericDataType">
	import { createEventDispatcher } from 'svelte';
	import type { GenericDataType } from '$lib/types/GenericDataType';
	import type { TableData } from '$lib/types/TableData';
	import Paginator from '$lib/components/Paginator.svelte';
	import Table from '$lib/components/Table.svelte';
	import QueryBuilder from './QueryBuilder.svelte';
	export let showData: boolean = false;
	export let editable: boolean = true;
	export let paginatorTop: boolean = true;
	export let options: {
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
	};
	export let meta: {
		total: number;
		perPage: number;
		currentPage: number;
		lastPage: number;
		firstPage: 1;
		firstPageUrl: string;
		lastPageUrl: string;
		nextPageUrl: string;
		prevPageUrl: string;
	};
	export let uniqueUrl: string = '';
	export let columns: { [key: string]: string[] };
	export let data: TableData<DataType> = { data: [], columns: [], notOrderedColumns: [] };

	if (uniqueUrl === '') {
		editable = false;
	}

	let operations = ['none', '=', '!=', '>', '>=', '<', '<=', 'like'];
	let typesOfWhere = ['and', 'or'];

	function changePage(newPage: number) {
		options.page = newPage;
		dispatchOptionsUpdated();
	}

	const dispatch = createEventDispatcher();

	function dispatchOptionsUpdated() {
		dispatch('optionsUpdated');
	}
</script>

<div class="grid grid-cols-1 place-items-center p-2">
	<div class="grid grid-cols-2 w-full mt-2">
		<div class="relative {!paginatorTop ? 'col-span-2' : ''}">
			<QueryBuilder bind:columns bind:options bind:operations bind:typesOfWhere />
			<button
				type="submit"
				on:click={() => dispatchOptionsUpdated()}
				class="text-white mt-0.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>Search</button
			>
		</div>
		{#if paginatorTop}
			<Paginator bind:meta bind:options {changePage} />
		{/if}
	</div>
	{#if !showData}
		<slot />
	{:else}
		<Table bind:data bind:options bind:meta bind:uniqueUrl bind:editable {changePage} />
	{/if}
	<div class="my-2">
		<Paginator
			bind:meta
			bind:options
			{changePage}
			on:optionsUpdated={() => dispatchOptionsUpdated()}
			orientation="vertical"
		/>
	</div>
</div>
