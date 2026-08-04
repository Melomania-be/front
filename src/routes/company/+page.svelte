<script lang="ts">
	import { onMount } from 'svelte';

	let companies = [];
	let search = '';
let newCompany = '';
let showNewCompany = false;
let editingId: number | null = null;
let editedName = '';
	$: filteredCompanies = companies.filter((company) =>
		company.name
			.toLowerCase()
			.includes(search.toLowerCase())
	);

	onMount(async () => {
		const response = await fetch('/api/company');

		if (response.ok) {
			companies = await response.json();
		}
	});
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

		newCompany = '';
		showNewCompany = false;
	} else {
		const error = await response.json();
		alert(error.message ?? 'Failed to create company');
	}
}
async function updateCompany(id: number) {
	const response = await fetch(`/api/company/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			name: editedName
		})
	});

	if (response.ok) {
		const updated = await response.json();

		companies = companies.map((company) =>
			company.id === id ? updated : company
		);

		editingId = null;
		editedName = '';
	} else {
		const error = await response.json();
		alert(error.message ?? 'Failed to update company');
	}
}
async function deleteCompany(id: number) {
	if (!confirm('Are you sure you want to delete this company?')) {
		return;
	}

	const response = await fetch(`/api/company/${id}`, {
		method: 'DELETE'
	});

	if (response.ok) {
		companies = companies.filter(
			(company) => company.id !== id
		);
	} else {
		const error = await response.json();

let message = error.message;

try {
	message = JSON.parse(message).message;
} catch {
	// Already plain text
}

alert(message);
	}
}
</script>
<div class="flex justify-between items-center mt-4 mb-6 px-4">
	<h1 class="text-2xl font-bold">
	Companies ({companies.length})
</h1>

	<button
		class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
		on:click={() => (showNewCompany = !showNewCompany)}
	>
		+ New Company
	</button>
</div>
{#if showNewCompany}
	<div class="mb-4 border rounded-lg p-4 bg-gray-50">
		<label class="block font-medium mb-2">
		    Company name
		</label>

		<div class="flex gap-2">
			<input
				type="text"
				bind:value={newCompany}
				class="flex-1 border rounded px-3 py-2"
				placeholder="Enter company name..."
			/>

			<button
				class="bg-green-600 text-white px-4 rounded"
				on:click={createCompany}
			>
				Save
			</button>

			<button
				class="bg-gray-500 text-white px-4 rounded"
				on:click={() => {
					showNewCompany = false;
					newCompany = '';
				}}
			>
				Cancel
			</button>
		</div>
	</div>
{/if}
<div class="bg-white rounded-lg shadow p-4">

	<div class="mb-4">
		<input
			type="text"
			placeholder="Search company..."
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

		<th class="p-3 text-center w-40">
			Actions
		</th>
	</tr>
</thead>

	<tbody>

		{#each filteredCompanies as company}
<tr class="border-b hover:bg-gray-100">

	<td class="p-3 font-medium">

		{#if editingId === company.id}

			<input
				bind:value={editedName}
				class="border rounded px-2 py-1 w-full"
			/>

		{:else}

			{company.name}

		{/if}

	</td>

	<td class="p-3 text-center">

		<div class="flex justify-center gap-2">

			{#if editingId === company.id}

				<button
					class="bg-green-600 text-white px-3 py-1 rounded text-sm"
					on:click={() => updateCompany(company.id)}
				>
					Save
				</button>

				<button
					class="bg-gray-500 text-white px-3 py-1 rounded text-sm"
					on:click={() => {
						editingId = null;
						editedName = '';
					}}
				>
					Cancel
				</button>

			{:else}

				<button
					class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
					on:click={() => {
						editingId = company.id;
						editedName = company.name;
					}}
				>
					Edit
				</button>

				<button
	class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
	on:click={() => deleteCompany(company.id)}
>
	Delete
</button>

			{/if}

		</div>

	</td>

</tr>

		{/each}

		{#if filteredCompanies.length === 0}

			<tr>

				<td class="text-center py-8 text-gray-500">
					No companies found
				</td>

			</tr>

		{/if}

	</tbody>

</table>

</div>
