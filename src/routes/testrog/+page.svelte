<script lang="ts">
	import { onMount } from 'svelte';

	let organizations = [];
	let search = '';
let newOrganization = '';
let showNewOrganization = false;
let editingId: number | null = null;
let editedName = '';
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

		newOrganization = '';
		showNewOrganization = false;
	} else {
		const error = await response.json();
		alert(error.message ?? 'Failed to create organization');
	}
}
async function updateOrganization(id: number) {
	const response = await fetch(`/api/organization/${id}`, {
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

		organizations = organizations.map((organization) =>
			organization.id === id ? updated : organization
		);

		editingId = null;
		editedName = '';
	} else {
		const error = await response.json();
		alert(error.message ?? 'Failed to update organization');
	}
}
async function deleteOrganization(id: number) {
	if (!confirm('Are you sure you want to delete this organization?')) {
		return;
	}

	const response = await fetch(`/api/organization/${id}`, {
		method: 'DELETE'
	});

	if (response.ok) {
		organizations = organizations.filter(
			(organization) => organization.id !== id
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
	Organizations ({organizations.length})
</h1>

	<button
		class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
		on:click={() => (showNewOrganization = !showNewOrganization)}
	>
		+ New Organization
	</button>
</div>
{#if showNewOrganization}
	<div class="mb-4 border rounded-lg p-4 bg-gray-50">
		<label class="block font-medium mb-2">
			Organization name
		</label>

		<div class="flex gap-2">
			<input
				type="text"
				bind:value={newOrganization}
				class="flex-1 border rounded px-3 py-2"
				placeholder="Enter organization name..."
			/>

			<button
				class="bg-green-600 text-white px-4 rounded"
				on:click={createOrganization}
			>
				Save
			</button>

			<button
				class="bg-gray-500 text-white px-4 rounded"
				on:click={() => {
					showNewOrganization = false;
					newOrganization = '';
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

		<th class="p-3 text-center w-40">
			Actions
		</th>
	</tr>
</thead>

	<tbody>

		{#each filteredOrganizations as organization}
<tr class="border-b hover:bg-gray-100">

	<td class="p-3 font-medium">

		{#if editingId === organization.id}

			<input
				bind:value={editedName}
				class="border rounded px-2 py-1 w-full"
			/>

		{:else}

			{organization.name}

		{/if}

	</td>

	<td class="p-3 text-center">

		<div class="flex justify-center gap-2">

			{#if editingId === organization.id}

				<button
					class="bg-green-600 text-white px-3 py-1 rounded text-sm"
					on:click={() => updateOrganization(organization.id)}
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
						editingId = organization.id;
						editedName = organization.name;
					}}
				>
					Edit
				</button>

				<button
	class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
	on:click={() => deleteOrganization(organization.id)}
>
	Delete
</button>

			{/if}

		</div>

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
