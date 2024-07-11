<script lang="ts" generics="DataType extends GenericDataType">
	import { createEventDispatcher } from 'svelte';
	import type { GenericDataType } from '$lib/types/GenericDataType';
	import type { TableData } from '$lib/types/TableData';
	import Paginator from '$lib/components/Paginator.svelte';
	import Table from '$lib/components/Table.svelte';
	export let showData: boolean = false;
	export let editable: boolean = true;
	export let paginatorTop: boolean = true;
	export let options: {
		filter: string;
		limit: number;
		page: number;
		order: 'asc' | 'desc';
		orderBy: string;
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
	export let data: TableData<DataType> = { data: [], columns: [], notOrderedColumns: [] };
	export let uniqueUrl: string = '';
	export let buttonLinkId: boolean = true;
	export let selectedData: GenericDataType;

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
			<div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
				<svg
					class="w-4 h-4 text-gray-500 dark:text-gray-400"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 20 20"
				>
					<path
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
					/>
				</svg>
			</div>
			<input
				type="search"
				id="default-search"
				bind:value={options.filter}
				on:keypress={(event) => (event.key === 'Enter' ? dispatchOptionsUpdated() : null)}
				class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
				placeholder="Search for {data.columns.join(', ')}..."
				required
			/>
			<button
				type="submit"
				on:click={() => dispatchOptionsUpdated()}
				class="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>Search</button
			>
		</div>
		{#if paginatorTop}
			<Paginator bind:meta bind:options {changePage} />
		{/if}
	</div>
	{#if !showData}
		<div class="mt-1 flex items-center justify-center">
			{#each data.columns as column}
				<button
					class="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-red-600 to-green-800 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800"
					on:click={() => {
						options.orderBy = typeof column === 'string' ? column : '';
						options.order = options.order === 'asc' ? 'desc' : 'asc';
						options.page = meta.firstPage;
						dispatchOptionsUpdated();
					}}
				>
					<span
						class="relative inline-flex items-center justify-center px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0"
					>
						{column}
						{#if options.orderBy === column}
							{#if options.order === 'asc'}
								<span
									class="icon-[tdesign--order-ascending] ml-2"
									style="width: 1.2rem; height: 1.2rem; color: black;"
								></span>
							{:else}
								<span
									class="icon-[tdesign--order-descending] ml-2"
									style="width: 1.2rem; height: 1.2rem; color: black;"
								></span>
							{/if}
						{:else}
							<span class="ml-2" style="width: 1.2rem; height: 1.2rem;"></span>
						{/if}
					</span>
				</button>
			{/each}
		</div>
		<slot />
	{:else}
		<Table {data} bind:options bind:meta bind:uniqueUrl bind:editable {changePage} buttonLinkId={buttonLinkId} bind:selectedData/>
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
