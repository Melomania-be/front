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
				<span class="font-semibold">Email:</span>
				{contractor.email1 ?? '-'}
			</div>

			<div>
				<span class="font-semibold">Phone:</span>
				{contractor.phone1 ?? '-'}
			</div>

			<div>
				<span class="font-semibold">Comments:</span>
				{contractor.comments ?? '-'}
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