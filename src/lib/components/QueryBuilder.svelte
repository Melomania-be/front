<script lang="ts">
	import Condition from '$lib/components/Condition.svelte';

	export let columns: { [key: string]: string[] };
	export let options: {
		filters: {
			type: string;
			filtersDepth1: {
				type: string;
				filtersDepth2: { relation: string; column: string; operation: string; filter: string }[];
			}[];
		};
	};
	export let operations: string[];
	export let typesOfWhere: string[];

	const filter = {
		relation: '',
		column: '',
		operation: '',
		filter: ''
	};

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

	function deleteGroup(depth1: any) {
		options.filters.filtersDepth1 = options.filters.filtersDepth1.filter(
			(item: any) => item !== depth1
		);
	}
</script>

{#if columns}
	<div class="w-full border rounded p-0.5">
		{#each options.filters.filtersDepth1 as depth1}
			<div class="flex items-center">
				{#if depth1 !== options.filters.filtersDepth1[0]}
					<div>
						{options.filters.type}
					</div>
				{/if}
				<div class="border m-0.5 p-0.5">
					<div>
						{#each depth1.filtersDepth2 as depth2}
							<Condition
								{operations}
								bind:columns
								bind:depth1
								bind:filter={depth2}
								noType={depth2 === depth1.filtersDepth2[0]}
							/>
						{/each}
					</div>
					<div>
						{#if depth1.filtersDepth2.length > 1}
							<select bind:value={depth1.type} class="mr-2">
								{#each typesOfWhere as type}
									<option value={type}>{type}</option>
								{/each}
							</select>
						{/if}
						<button
							class="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
							on:click={() => addCondition(depth1)}>+</button
						>
					</div>
				</div>
				<button on:click={() => deleteGroup(depth1)}>
					<span class="icon-[material-symbols-light--delete] hover:text-red-500"></span>
				</button>
			</div>
		{/each}
		<div>
			{#if options.filters.filtersDepth1.length > 1}
				<select bind:value={options.filters.type} class="mr-2">
					{#each typesOfWhere as type}
						<option value={type}>{type}</option>
					{/each}
				</select>
			{/if}
			<button
				class="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
				on:click={addSubCondition}>+</button
			>
		</div>
	</div>
{/if}
