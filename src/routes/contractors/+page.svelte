<script lang="ts">
	import { onMount } from 'svelte';

	let contractors = [];
	let contractorCount = 0;
let organizationCount = 0;
let categoryCount = 0;

	onMount(async () => {
		const response = await fetch('/api/contractor');

		if (response.ok) {
			const data = await response.json();
            console.log(data);

		contractors = data;
		contractorCount = contractors.length;

const organizations = new Set(
	contractors
		.map((c) => c.organization?.name)
		.filter(Boolean)
);

organizationCount = organizations.size;

const categories = new Set();

contractors.forEach((c) => {
	(c.categories ?? []).forEach((cat) => {
		categories.add(cat.name);
	});
});

categoryCount = categories.size;
		}
	});
</script>

<h1 class="text-2xl font-bold mb-4">
	Contractor Contacts
</h1>
<div class="grid grid-cols-3 gap-4 mb-6">

	<div class="bg-white rounded shadow p-4 text-center">
		<p class="text-gray-500 text-sm">Contractors</p>
		<p class="text-3xl font-bold">{contractorCount}</p>
	</div>

	<div class="bg-white rounded shadow p-4 text-center">
		<p class="text-gray-500 text-sm">Organizations</p>
		<p class="text-3xl font-bold">{organizationCount}</p>
	</div>

	<div class="bg-white rounded shadow p-4 text-center">
		<p class="text-gray-500 text-sm">Categories</p>
		<p class="text-3xl font-bold">{categoryCount}</p>
	</div>

</div>
<a
	href="/contractors/create"
	class="bg-blue-500 text-white px-4 py-2 rounded inline-block mb-4"
>
	Create Contractor
</a>
<div class="bg-white rounded-lg shadow p-4">
<table class="w-full border">
	<thead>
	<tr>
		<th class="p-3 text-left">Name</th>
		<th class="p-3 text-left">Organization</th>
		<th class="p-3 text-left">Email</th>
		<th class="p-3 text-left">Phone</th>
		<th class="p-3 text-left">Categories</th>
	</tr>
</thead>
	<tbody>
	{#each contractors as contractor}
		<tr
	class="border-b cursor-pointer hover:bg-gray-100"
	on:click={() => {
		window.location.href = `/contractors/${contractor.id}`;
	}}
>
			<td class="p-3">
				{contractor.firstName}
				{contractor.lastName}
			</td>

			<td class="p-3">
				{contractor.organization?.name ?? '-'}
			</td>

			<td class="p-3">
				{contractor.email1 ?? '-'}
			</td>

			<td class="p-3">
				{contractor.phone1 ?? '-'}
			</td>

			<td class="p-3">
				{#each contractor.categories ?? [] as category}
					<span
						class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1"
					>
						{category.name}
					</span>
				{/each}
			</td>
		</tr>
	{/each}
</tbody>
</table>
</div>