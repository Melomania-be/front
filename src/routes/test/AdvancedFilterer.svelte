<script lang="ts" generics="DataType extends GenericDataType">
	import { createEventDispatcher } from 'svelte';
	import type { GenericDataType } from '$lib/types/GenericDataType';
	import type { TableData } from '$lib/types/TableData';
	import Paginator from '$lib/components/Paginator.svelte';
	import Table from '$lib/components/Table.svelte';
	import Condition from './Condition.svelte';
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
	let filter = {
		relation: '',
		column: '',
		operation: '',
		filter: ''
	};
	let typeOfWhere = ['and', 'or'];

	function changePage(newPage: number) {
		options.page = newPage;
		dispatchOptionsUpdated();
	}

	const dispatch = createEventDispatcher();

	function dispatchOptionsUpdated() {
		dispatch('optionsUpdated');
	}

	function addCondition(depth1: any) {
		const tmpFilter = { ...filter };
		tmpFilter.relation = 'self';
		tmpFilter.column = 'id';
		tmpFilter.operation = '=';
		tmpFilter.filter = '1';

		depth1.filtersDepth2.push(tmpFilter);
		options = options;
	}

	function addSubCondition() {
		options.filters.filtersDepth1.push({
			type: 'and',
			filtersDepth2: []
		});
		options = options;
	}
</script>

<div class="grid grid-cols-1 place-items-center p-2">
	<div class="grid grid-cols-2 w-full mt-2">
		<div class="relative {!paginatorTop ? 'col-span-2' : ''}">
			{#if columns}
				<div>
					{#each options.filters.filtersDepth1 as depth1}
						{#if options.filters.filtersDepth1.length > 1 && depth1 !== options.filters.filtersDepth1[0]}
							<select bind:value={options.filters.type} class="mr-2">
								{#each typeOfWhere as type}
									<option value={type}>{type}</option>
								{/each}
							</select>
						{/if}
						<div class="border w-fit">
							{#each depth1.filtersDepth2 as depth2}
								<Condition
									{operations}
									typesOfWhere={typeOfWhere}
									bind:columns
									bind:depth1
									bind:filter={depth2}
								/>
							{/each}

							<div>
								<button
									class="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
									on:click={() => addCondition(depth1)}>+</button
								>
							</div>
						</div>
					{/each}
					<div>
						<button
							class="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
							on:click={addSubCondition}>+</button
						>
					</div>
				</div>
			{/if}
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
