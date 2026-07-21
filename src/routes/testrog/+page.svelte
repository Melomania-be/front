<script lang="ts">
	import { onMount } from 'svelte';

	let organizations = [];
	let search = '';

	$: filteredOrganizations = organizations.filter((organization) =>
		organization.name
			.toLowerCase()
			.includes(search.toLowerCase())
	);

	onMount(async () => {
		const response = await fetch('/api/organization');

		if (response.ok) {
			organizations = await response.json();
		}
	});
</script>
<h1 class="text-2xl font-bold mb-4">
	Organizations
</h1>

<div class="bg-white rounded-lg shadow p-4">

	<div class="mb-4">
		<input
			type="text"
			placeholder="Search organization..."
			bind:value={search}
			class="w-full md:w-96 border rounded-lg px-4 py-2"
		/>
	</div>

    <table class="w-full border">

	<thead>
		<tr>
			<th class="p-3 text-left">
				Name
			</th>
		</tr>
	</thead>

	<tbody>

		{#each filteredOrganizations as organization}

			<tr class="border-b hover:bg-gray-100">

				<td class="p-3 font-medium">
					{organization.name}
				</td>

			</tr>

		{/each}

		{#if filteredOrganizations.length === 0}

			<tr>

				<td class="text-center py-8 text-gray-500">
					No organizations found
				</td>

			</tr>

		{/if}

	</tbody>

</table>

</div>
