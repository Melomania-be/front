<script lang="ts">
	import { goto } from '$app/navigation';
import { onMount } from 'svelte';

let interactions = [];
let selectedFiles: Record<number, File | null> = {};
let uploading: Record<number, boolean> = {};
let interactionDate =
	new Date().toISOString().split('T')[0];

let interactionDescription = '';
	export let data;

const contractor = data.contractor;
onMount(async () => {
	const response = await fetch(
		`/api/contractor-interaction/contractor/${contractor.id}`
	);

	if (response.ok) {
		interactions = await response.json();
	}
});
async function addInteraction() {
	const response = await fetch(
		'/api/contractor-interaction',
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				contractor_contact_id: contractor.id,
				interaction_date: interactionDate,
				description: interactionDescription
			})
		}
	);

	if (!response.ok) {
		alert('Failed to create interaction');
		return;
	}

	const interaction = await response.json();

	interactions = [interaction, ...interactions];

	interactionDate = '';
	interactionDescription = '';
}
async function deleteInteraction(id: number) {
	const confirmed = confirm('Delete this interaction?');

	if (!confirmed) return;

	const response = await fetch(
		`/api/contractor-interaction/${id}`,
		{
			method: 'DELETE'
		}
	);

	if (response.ok) {
		interactions = interactions.filter(
			(interaction) => interaction.id !== id
		);
	} else {
		alert('Failed to delete interaction');
	}
}

async function uploadInteractionFile(interactionId: number) {
	const file = selectedFiles[interactionId];

	if (!file) {
		alert('Please select a file.');
		return;
	}

	uploading[interactionId] = true;

	const formData = new FormData();
	formData.append('file', file);

	const response = await fetch(
		`/api/contractor-interaction/${interactionId}/upload`,
		{
			method: 'POST',
			body: formData
		}
	);

	uploading[interactionId] = false;

	if (!response.ok) {
		alert('Upload failed.');
		return;
	}

	// reload interactions
	const res = await fetch(
		`/api/contractor-interaction/contractor/${contractor.id}`
	);

	if (res.ok) {
		interactions = await res.json();
		console.log(interactions);
	}

	selectedFiles[interactionId] = null;
}

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
	<div class="bg-white rounded-xl shadow border p-6 mt-6">

	<h2 class="text-xl font-semibold mb-4">
		Interaction History
	</h2>

	<!-- Add Interaction Form -->

	<div class="border rounded-lg p-4 mb-4 bg-gray-50">

		<div class="mb-3">

			<label class="block mb-1 font-medium">
				Date
			</label>

			<input
				type="date"
				bind:value={interactionDate}
				class="border rounded p-2 w-full"
			/>

		</div>

		<div class="mb-3">

			<label class="block mb-1 font-medium">
				Description
			</label>

			<textarea
				rows="4"
				bind:value={interactionDescription}
				class="border rounded p-2 w-full"
			></textarea>

		</div>

		<button
			class="bg-blue-600 text-white px-4 py-2 rounded"
			on:click={addInteraction}
		>
			Add Interaction
		</button>

	</div>

	<!-- Interaction List -->

	{#if interactions.length === 0}

		<p class="text-gray-500">
			No interactions recorded.
		</p>

	{:else}

		{#each interactions as interaction}

			<div class="flex justify-between items-center">

	<div class="font-semibold text-sm text-gray-600">
		{interaction.interactionDate}
	</div>

	<button
		class="text-red-600 hover:underline text-sm"
		on:click={() => deleteInteraction(interaction.id)}
	>
		Delete
	</button>

</div>

<div class="mt-2">
	{interaction.description}
</div>

{#if interaction.files?.length}

	<div class="mt-3 space-y-2">

		{#each interaction.files as attachment}
<p>{attachment.file.type}</p>
	{#if attachment.file.type === 'image'}

		<a
			href={`/api/contractor-interaction/file/${attachment.file.path.split('\\').pop()}`}
			target="_blank"
		>
			<img
				src={`/api/contractor-interaction/file/${attachment.file.path.split('\\').pop()}`}
				alt={attachment.file.name}
				class="mt-2 w-40 rounded-lg border shadow hover:opacity-90 cursor-pointer"
			/>
		</a>

	{:else}

		<a
			href={`/api/contractor-interaction/file/${attachment.file.path.split('\\').pop()}`}
			target="_blank"
			class="text-blue-600 hover:underline"
		>
			📎 {attachment.file.name}
		</a>

	{/if}

{/each}

	</div>

{/if}

<div class="mt-3 flex items-center gap-3">

	<input
		type="file"
		on:change={(e) => {
			const files = e.currentTarget.files;

			selectedFiles[interaction.id] =
				files && files.length
					? files[0]
					: null;
		}}
	/>

	<button
		class="bg-green-600 text-white px-3 py-1 rounded"
		disabled={uploading[interaction.id]}
		on:click={() =>
			uploadInteractionFile(interaction.id)}
	>
		{uploading[interaction.id]
			? 'Uploading...'
			: 'Upload file'}
	</button>

</div>

		{/each}

	{/if}

</div>

</div>