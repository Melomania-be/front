<script lang="ts">
    export let depth1: any;
    export let filter: any;
    export let columns: any;
    export let operations: any;
    export let typesOfWhere: any;
</script>

<div class="ml-6">
    {#if depth1.filtersDepth2.length > 1 && filter !== depth1.filtersDepth2[0]}
        <select bind:value={depth1.type} class="mr-2">
            {#each typesOfWhere as type}
                <option value={type}>{type}</option>
            {/each}
        </select>
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
    <input type="text" bind:value={filter.filter} />
</div>