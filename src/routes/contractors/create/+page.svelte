<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	
let categories: any[] = [];
let selectedCategories: number[] = [];
let newOrganization = '';
let showNewOrganization = false;
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
	let email2 = '';
let email3 = '';

let phone1 = '';
let phone2 = '';
let phone3 = '';

let comments = '';
let newCategory = '';
let showNewCategory = false;

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
	email_2: email2,
	email_3: email3,

	phone_1: phone1,
	phone_2: phone2,
	phone_3: phone3,

	comments,

	organization_id: organizationId ? Number(organizationId) : null,
	category_ids: selectedCategories
})
		});

		if (response.ok) {
			goto('/contractors');
		} else {
			alert('Error creating contractor');
		}
	}
	async function createCategory() {
	const response = await fetch('/api/contractor-category', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			name: newCategory
		})
	});

	if (response.ok) {
		const category = await response.json();

		categories = [...categories, category];

		selectedCategories = [
			...selectedCategories,
			category.id
		];

		newCategory = '';
		showNewCategory = false;
	} else {
		alert('Failed to create category');
	}
}
async function createOrganization() {
	const response = await fetch('/api/organization', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			name: newOrganization
		})
	});

	if (response.ok) {
		const organization = await response.json();

		organizations = [...organizations, organization];

		organizationId = organization.id.toString();

		newOrganization = '';
		showNewOrganization = false;
	} else {
		alert('Failed to create organization');
	}
}
</script>
<div class="max-w-3xl mx-auto p-6">
<h1 class="text-2xl font-bold mb-6">
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
	<label class="block mb-1">Email 2</label>
	<input
		class="border p-2 w-full rounded"
		bind:value={email2}
	/>
</div>

<div class="mb-4">
	<label class="block mb-1">Email 3</label>
	<input
		class="border p-2 w-full rounded"
		bind:value={email3}
	/>
</div>
<div class="mb-4">
	<label class="block mb-1">Phone 1</label>
	<input
		class="border p-2 w-full rounded"
		bind:value={phone1}
	/>
</div>

<div class="mb-4">
	<label class="block mb-1">Phone 2</label>
	<input
		class="border p-2 w-full rounded"
		bind:value={phone2}
	/>
</div>

<div class="mb-4">
	<label class="block mb-1">Phone 3</label>
	<input
		class="border p-2 w-full rounded"
		bind:value={phone3}
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

<div class="mt-4">

	<button
		type="button"
		class="text-blue-600 hover:underline"
		on:click={() => (showNewOrganization = !showNewOrganization)}
	>
		+ Add new organization
	</button>

</div>

{#if showNewOrganization}

	<div class="mt-3 flex gap-2">

		<input
			class="border rounded p-2 flex-1"
			placeholder="Organization name"
			bind:value={newOrganization}
		/>

		<button
			type="button"
			class="bg-green-600 text-white px-4 rounded"
			on:click={createOrganization}
		>
			Save
		</button>

	</div>

{/if}

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
<div class="mt-4">

	<button
		type="button"
		class="text-blue-600 hover:underline"
		on:click={() => (showNewCategory = !showNewCategory)}
	>
		+ Add new category
	</button>

</div>
{#if showNewCategory}

	<div class="mt-3 flex gap-2">

		<input
			class="border rounded p-2 flex-1"
			placeholder="Category name"
			bind:value={newCategory}
		/>

		<button
			type="button"
			class="bg-green-600 text-white px-4 rounded"
			on:click={createCategory}
		>
			Save
		</button>

	</div>

{/if}
	</div>
</div>
</div>
<div class="mb-4">
	<label class="block mb-1">Comments</label>

	<textarea
		class="border p-2 w-full rounded"
		rows="5"
		bind:value={comments}
	></textarea>
</div>
</div>

	<button
		class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
		on:click={saveContractor}
	>
		Save
	</button>

</div>
