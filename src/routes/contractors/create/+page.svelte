<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	
let categories: any[] = [];
let selectedCategories: number[] = [];

let organizations : any[] = [];
let organizationId = '';
onMount(async () => {
	const response = await fetch('/api/organization');

	if (response.ok) {
		organizations = await response.json();
	}
	const categoryResponse = await fetch('/api/contractor-category');

if (categoryResponse.ok) {
	categories = await categoryResponse.json();
}
});
	let firstName = '';
	let lastName = '';
	let email1 = '';

	async function saveContractor() {
		const response = await fetch('/api/contractor', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
	first_name: firstName,
	last_name: lastName,
	email_1: email1,
	organization_id: Number(organizationId),
	category_ids: selectedCategories
})
		});

		if (response.ok) {
			goto('/contractors');
		} else {
			alert('Error creating contractor');
		}
	}
</script>

<h1 class="text-2xl font-bold mb-4">
	Create Contractor
</h1>

<div class="bg-white rounded-lg shadow p-4 max-w-xl">

	<div class="mb-4">
		<label class="block mb-1">First Name</label>
		<input
			class="border p-2 w-full rounded"
			bind:value={firstName}
		/>
	</div>

	<div class="mb-4">
		<label class="block mb-1">Last Name</label>
		<input
			class="border p-2 w-full rounded"
			bind:value={lastName}
		/>
	</div>

	<div class="mb-4">
		<label class="block mb-1">Email</label>
		<input
			class="border p-2 w-full rounded"
			bind:value={email1}
		/>
	</div>
	<div class="mb-4">
	<label class="block mb-1">Organization</label>

	<select
	class="border p-2 w-full rounded"
	bind:value={organizationId}
>
	<option value="">Select organization</option>

	{#each organizations as organization}
		<option value={organization.id}>
			{organization.name}
		</option>
	{/each}
</select>

<div class="mb-4">
	<label class="block mb-2 font-medium">
		Categories
	</label>

	<div class="space-y-2">

		{#each categories as category}

			<label class="flex items-center gap-2">

				<input
					type="checkbox"
					value={category.id}
					on:change={(e) => {
						if (e.currentTarget.checked) {
							selectedCategories = [
								...selectedCategories,
								category.id
							];
						} else {
							selectedCategories =
								selectedCategories.filter(
									(id) => id !== category.id
								);
						}
					}}
				/>

				{category.name}

			</label>

		{/each}

	</div>
</div>

</div>

	<button
		class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
		on:click={saveContractor}
	>
		Save
	</button>

</div>