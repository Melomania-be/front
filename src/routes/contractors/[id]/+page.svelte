<script lang="ts">
	import { goto } from '$app/navigation';

	export let data;

	const contractor = data.contractor;

	async function deleteContractor() {
		const confirmed = confirm(
			`Delete ${contractor.firstName} ${contractor.lastName}?`
		);

		if (!confirmed) return;

		const response = await fetch(
			`/api/contractor/${contractor.id}`,
			{
				method: 'DELETE'
			}
		);

		if (response.ok) {
			goto('/contractors');
		} else {
			alert('Failed to delete contractor');
		}
	}
</script>
<a
	href="/contractors"
	class="inline-flex items-center mb-4 text-blue-600 hover:text-blue-800 font-medium"
>
	← Back to Contractor List
</a>
<h1 class="text-2xl font-bold mb-4">
	{contractor.firstName} {contractor.lastName}
</h1>
<div class="flex gap-2 mb-4">

	<a
	href={`/contractors/${contractor.id}/edit`}
	class="bg-blue-600 text-white px-4 py-2 rounded"
>
	Edit
</a>

	<button
	class="bg-red-600 text-white px-4 py-2 rounded"
	on:click={deleteContractor}
>
	Delete
</button>

</div>
<div class="max-w-4xl mx-auto p-6">

	<div class="bg-white rounded-xl shadow border p-6 mb-6">

		<h1 class="text-3xl font-bold">
			{contractor.firstName} {contractor.lastName}
		</h1>

		<p class="text-gray-500 mt-1">
			{contractor.organization?.name ?? 'No organization'}
		</p>

		<div class="mt-6 space-y-3">

			<div>
	<span class="font-semibold">Emails:</span>

	<div class="ml-2 mt-1">
		{#if contractor.email1}
			<div>{contractor.email1}</div>
		{/if}

		{#if contractor.email2}
			<div>{contractor.email2}</div>
		{/if}

		{#if contractor.email3}
			<div>{contractor.email3}</div>
		{/if}

		{#if !contractor.email1 && !contractor.email2 && !contractor.email3}
			<div>-</div>
		{/if}
	</div>
</div>

			<div>
	<span class="font-semibold">Phones:</span>

	<div class="ml-2 mt-1">
		{#if contractor.phone1}
			<div>{contractor.phone1}</div>
		{/if}

		{#if contractor.phone2}
			<div>{contractor.phone2}</div>
		{/if}

		{#if contractor.phone3}
			<div>{contractor.phone3}</div>
		{/if}

		{#if !contractor.phone1 && !contractor.phone2 && !contractor.phone3}
			<div>-</div>
		{/if}
	</div>
</div>

			<div>
	<span class="font-semibold">Comments:</span>

	<div
		class="mt-2 p-3 border rounded bg-gray-50 max-h-40 overflow-y-auto whitespace-pre-wrap"
	>
		{contractor.comments ?? '-'}
	</div>
</div>

		</div>

	</div>

	<div class="bg-white rounded-xl shadow border p-6">

		<h2 class="text-xl font-semibold mb-4">
			Categories
		</h2>

		<div class="flex flex-wrap gap-2">

			{#each contractor.categories ?? [] as category}
				<span
					class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
				>
					{category.name}
				</span>
			{/each}

		</div>

	</div>

</div>