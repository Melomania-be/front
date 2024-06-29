<script lang="ts">
	import type { Contact } from '$lib/types/Contact';
	import type { Instrument } from '$lib/types/Instrument';

	export let contact: Contact;

	let selectedInstrument: Instrument = contact.instruments[0];

	async function errorEvent(response: Response) {
		if (response.status >= 400 && response.status < 500) {
			const jsonResponse = await response.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		} else if (response.status >= 500) {
			alert('Server error');
		}
		//else if(response.status === 200){
		//	window.location.reload()
		//}
	}

	async function deleteContact(contact: Contact) {
		
		console.log(contact);
		let response = await fetch('/api/contacts/', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(contact)
		});

		errorEvent(response);
	}
</script>

<div>
	<div class="flex border-2 border-green-500">
		<!--affichage des informations du contact-->
		<div class="w-1/2 border-2 border-rose-500">
			<span>prénom : {contact.firstName}</span>
			<br />
			<span>nom : {contact.lastName}</span>
			<br />
			<span>tel : {contact.phone}</span>
			<br />
			<span>mail : {contact.email}</span>
			<br />
			<span>messager : {contact.messenger}</span>
			<br />
			<span>proficiency level : {contact.proficiency_level}</span>
			<br />
			<span>validated ? : {contact.validated}</span>
			<br />
			<span>created at : {contact.created_at}</span>
			<br />
			<span>last update : {contact.last_update}</span>
			<br />
			<span>comments : {contact.comments}</span>
		</div>

		<!--afichages des instruments joué par le contact-->
		<div class="flex w-1/2 border-2 border-blue-500">
			<div class="w-1/2">
				<span>instruments :</span>
				<select class="flex w-1/2" bind:value={selectedInstrument}>
					{#if contact.instruments !== null}
						<optgroup label="instrument">
							{#each contact.instruments as instrument}
								<option value={instrument}>{instrument.name}</option>
							{/each}
						</optgroup>
					{/if}
				</select>
			</div>
			<div class="w-1/2">
				<span>name : {selectedInstrument.name}</span>
				<br />

				<span>family : {selectedInstrument.family}</span>
				<br />

				<span>Created at : {selectedInstrument.createdAt}</span>
				<br />

				<span>Last update : {selectedInstrument.updatedAt}</span>
				<br />
			</div>
		</div>
	</div>

	<div class="flex justify-center">
		<button class="p-1 border-2 border-red-500" on:click={() => deleteContact(contact)}
			>Delete</button
		>
		<a class="p-1 border-2 border-rose-500" href="/contacts/{contact.id}">Modify</a>
		{#if contact.validated !== true}
			<a class="p-1 border-2 border-rose-500" href="/contacts/validation/{contact.id}"
				>Validation Page</a
			>
		{/if}
	</div>
</div>
