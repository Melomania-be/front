<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	export let data;
console.log(data.contractor);
	let firstName = data.contractor.firstName ?? '';
	let lastName = data.contractor.lastName ?? '';
	let email1 = data.contractor.email1 ?? '';
	let organizations: any[] = [];
	let categories: any[] = [];
let organizationId = data.contractor.organizationId;
let selectedCategories: number[] =
	data.contractor.categories?.map(
		(category) => category.id
	) ?? [];

	async function updateContractor() {
		const response = await fetch(
			`/api/contractor/${data.contractor.id}`,
			{
				method: 'PUT',
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
			}
		);

		if (response.ok) {
			goto(`/contractors/${data.contractor.id}`);
		} else {
			alert('Error updating contractor');
		}
	}
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
</script>

<h1 class="text-2xl font-bold mb-4">
	Edit Contractor
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
		{#each organizations as organization}
			<option value={organization.id}>
				{organization.name}
			</option>
		{/each}
	</select>
	<div class="mb-4">

	<label class="block mb-2">
		Categories
	</label>

	{#each categories as category}

		<label class="flex items-center gap-2 mb-1">

			<input
				type="checkbox"
				checked={selectedCategories.includes(category.id)}
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

	<button
		class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
		on:click={updateContractor}
	>
		Save Changes
	</button>

</div>