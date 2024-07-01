<script lang="ts">
	import { onMount } from 'svelte';

	let meta: any;
	let contacts: any[] = [];
	let columns: any;
	let operation = ['none', '=', '!=', '>', '>=', '<', '<=', 'like'];
	let filter = {
		relation: '',
		column: '',
		operation: '',
		filter: ''
	};
	let typeOfWhere = ['and', 'or'];

	let data: {
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
		limit: 3,
		orderBy: 'id',
		order: 'asc'
	};

	onMount(async () => {
		fetchData();

		let response = await fetch('/test/api', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (response.ok) {
			const jsonResponse = await response.json();

			columns = jsonResponse;
		}

		console.log(columns);
	});

	$: console.log(data);

	function addCondition(depth1: any) {
		const tmpFilter = { ...filter };
		tmpFilter.relation = 'self';
		tmpFilter.column = 'id';
		tmpFilter.operation = '=';
		tmpFilter.filter = '1';

		depth1.filtersDepth2.push(tmpFilter);
		data = data;
	}

	function addSubCondition() {
		data.filters.filtersDepth1.push({
			type: 'and',
			filtersDepth2: []
		});
		data = data;
	}

	async function fetchData() {
		let response = await fetch('/test/api', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});

		if (response.status >= 400 && response.status < 500) {
			const jsonResponse = await response.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		}

		if (response.ok) {
			const jsonResponse = await response.json();

			contacts = jsonResponse.data;
			meta = jsonResponse.meta;
		}
	}
</script>

<div class="w-full">
	{#if columns}
		<div class="flex">
			{#each Object.keys(columns) as index}
				<div class="w-1/4 border">
					{index}
					{#each columns[index] as column}
						<div>
							<span>
								{column}
							</span>
						</div>
					{/each}
				</div>
			{/each}
		</div>
		<div>
			{#each data.filters.filtersDepth1 as depth1}
				<div class="border w-fit">
					{#if data.filters.filtersDepth1.length > 1 && depth1 !== data.filters.filtersDepth1[0]}
						<select bind:value={data.filters.type} class="mr-2">
							{#each typeOfWhere as type}
								<option value={type}>{type}</option>
							{/each}
						</select>
					{/if}
					{#each depth1.filtersDepth2 as depth2}
						<div class="ml-6">
							{#if depth1.filtersDepth2.length > 1 && depth2 !== depth1.filtersDepth2[0]}
								<select bind:value={depth1.type} class="mr-2">
									{#each typeOfWhere as type}
										<option value={type}>{type}</option>
									{/each}
								</select>
							{/if}

							<select bind:value={depth2.relation}>
								{#each Object.keys(columns) as index}
									<option value={index}>{index}</option>
								{/each}
							</select>
							.
							<select bind:value={depth2.column}>
								{#each columns[depth2.relation] as column}
									<option value={column}>{column}</option>
								{/each}
							</select>
							<select bind:value={depth2.operation}>
								{#each operation as op}
									<option value={op}>{op}</option>
								{/each}
							</select>
							<input type="text" bind:value={depth2.filter} />
						</div>
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
</div>
<button on:click={fetchData}>search</button>
<div>
	{#each contacts as contact}
		<div>
			{contact.firstName}
			{contact.lastName}
			{contact.email}
			{contact.phone}
		</div>
	{/each}
</div>
