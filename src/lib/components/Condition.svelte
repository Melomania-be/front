<script lang="ts">
	export let depth1: any;
	export let filter: any;
	export let columns: any;
	export let operations: any;
	export let noType: boolean = false;

	function deleteFilter() {
		depth1.filtersDepth2 = depth1.filtersDepth2.filter((item: any) => item !== filter);
	}
</script>

<div class="m-0.5">
	{#if !noType}
		<span>{depth1.type}</span>
	{/if}
	<select bind:value={filter.relation}>
		{#each Object.keys(columns) as index}
			<option value={index}>{index}</option>
		{/each}
	</select>
	.
	<select bind:value={filter.column}>
		{#each columns[filter.relation] as column}
			<option value={column}>{column}</option>
		{/each}
	</select>
	<select bind:value={filter.operation}>
		{#each operations as op}
			<option value={op}>{op}</option>
		{/each}
	</select>
	<input type="text" bind:value={filter.filter} class="border" />
	<button on:click={deleteFilter}>
		<span class="icon-[material-symbols-light--delete] hover:text-red-500"></span>
	</button>
</div>
