<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

function goBack() {
	history.back();
}

	export let data;

	let firstName = data.contractor.firstName ?? '';
	let lastName = data.contractor.lastName ?? '';
	let email1 = data.contractor.email1 ?? '';
	let email2 = data.contractor.email2 ?? '';
let email3 = data.contractor.email3 ?? '';
let newCompany = '';
let showNewCompany = false;
let phone1 = data.contractor.phone1 ?? '';
let phone2 = data.contractor.phone2 ?? '';
let phone3 = data.contractor.phone3 ?? '';
let newCategory = '';
let showNewCategory = false;
let comments = data.contractor.comments ?? '';
	let companies: any[] = [];
	let categories: any[] = [];
let companyId = data.contractor.companyId;
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
	email_2: email2,
	email_3: email3,

	phone_1: phone1,
	phone_2: phone2,
	phone_3: phone3,

	comments,

company_id: companyId ? Number(companyId) : null,
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
	const response = await fetch('/api/company');

	if (response.ok) {
		companies = await response.json();
	}
	const categoryResponse = await fetch('/api/contractor-category');

if (categoryResponse.ok) {
	categories = await categoryResponse.json();
}
});
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
async function createCompany() {
	const response = await fetch('/api/company', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			name: newCompany
		})
	});

	if (response.ok) {
		const company = await response.json();

		companies = [...companies, company];

		companyId = company.id.toString();

		newCompany = '';
		showNewCompany = false;
	} else {
		alert('Failed to create company');
	}
}
</script>

<div class="max-w-3xl mx-auto p-6">
<button
	type="button"
	class="mb-4 flex items-center text-blue-600 hover:text-blue-800 hover:underline"
	on:click={goBack}
>
	← Back
</button>
	<h1 class="text-2xl font-bold mb-6">
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
	<label class="block mb-1">Company</label>

	<select
		class="border p-2 w-full rounded"
		bind:value={companyId}
	>
		{#each companies as company}
			<option value={company.id}>
				{company.name}
			</option>
		{/each}
	</select>
	
<div class="mt-4">

	<button
		type="button"
		class="text-blue-600 hover:underline"
		on:click={() => (showNewCompany = !showNewCompany)}
	>
		+ Add new company
	</button>

</div>

{#if showNewCompany}

	<div class="mt-3 flex gap-2">

		<input
			class="border rounded p-2 flex-1"
			placeholder="Company name"
			bind:value={newCompany}
		/>

		<button
			type="button"
			class="bg-green-600 text-white px-4 rounded"
			on:click={createCompany}
		>
			Save
		</button>

	</div>
{/if}
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
<div class="mb-4">
	<label class="block mb-1">Comments</label>

	<textarea
		rows="5"
		class="border p-2 w-full rounded"
		bind:value={comments}
	></textarea>
</div>
	<button
		class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
		on:click={updateContractor}
	>
		Save Changes
	</button>

</div>
</div>