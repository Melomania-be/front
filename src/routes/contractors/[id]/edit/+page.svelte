<script lang="ts">
	import { goto } from '$app/navigation';

	export let data;

	let firstName = data.contractor.firstName ?? '';
	let lastName = data.contractor.lastName ?? '';
	let email1 = data.contractor.email1 ?? '';

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
					email_1: email1
				})
			}
		);

		if (response.ok) {
			goto(`/contractors/${data.contractor.id}`);
		} else {
			alert('Error updating contractor');
		}
	}
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

	<button
		class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
		on:click={updateContractor}
	>
		Save Changes
	</button>

</div>