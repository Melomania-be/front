<script lang="ts" generics="DataType extends GenericDataType">
	import { goto } from '$app/navigation';
	import type { GenericDataType } from '$lib/types/GenericDataType';
	import type { TableData } from '$lib/types/TableData';

	export let editable: boolean;
	export let data: TableData<DataType>;
	export let options:
		| {
				filter: any;
				limit: number;
				page: number;
				order: 'asc' | 'desc';
				orderBy: string;
		  }
		| {
				filters: {
					type: string;
					filtersDepth1: {
						type: string;
						filtersDepth2: {
							relation: string;
							column: string;
							operation: string;
							filter: string;
						}[];
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
	export let changePage: (newPage: number) => void;
	export let uniqueUrl: string;

	interface WithId {
		id: number;
	}

	// Function to check if an item has an id
	function hasId<T>(item: T): item is T & WithId {
		return (item as WithId).id !== undefined;
	}
</script>

<div class="grid grid-cols-1 w-full mt-2">
	<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
		<thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
			<tr>
				{#each data.columns as column}
					<th>
						<button
							on:click={() => {
								options.orderBy = typeof column === 'string' ? column : '';
								options.order = options.order === 'asc' ? 'desc' : 'asc';
								changePage(meta.firstPage);
							}}
							class="flex items-center justify-center"
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
						</button>
					</th>
				{/each}
				{#each data.notOrderedColumns as column}
					<th>
						{column}
					</th>
				{/each}
				{#if data.data.length > 0}
					{#if hasId(data.data[0])}
						<th> Actions </th>
					{/if}
				{/if}
			</tr>
		</thead>
		<tbody>
			{#each data.data as row}
				<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
					{#each data.columns as column}
						<td>{row[column]}</td>
					{/each}
					{#each data.notOrderedColumns as column}
						<td>{row[column]}</td>
					{/each}
					<td>
						{#if editable}
							{#if hasId(row)}
								<button
									on:click={() => {
										const url = `${uniqueUrl}/${row.id}`;
										goto(url);
									}}
									class="text-blue-700 hover:text-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:text-blue-500 dark:hover:text-blue-600 dark:focus:ring-blue-800"
								>
									<span class="icon-[formkit--arrowright] hover:text-black"></span>
								</button>
							{/if}
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
