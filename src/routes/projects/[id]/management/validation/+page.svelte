<script lang="ts">
	import AttendancePicker from '$lib/components/participant/AttendancePicker.svelte';
	import RegistrationForm from '$lib/components/registration/RegistrationForm.svelte';
	import type { Participant } from '$lib/types/Participant.js';
	import { onMount } from 'svelte';

	export let data;
	let participants: Array<Participant>;
	let currentParticipant: Participant | null;

	onMount(async () => {
		const responseParticipants = await fetch(`/api/projects/${data.id}/management/validation`);

		if (responseParticipants.ok) {
			participants = await responseParticipants.json();
		}
	});

	async function deleteParticipant() {
		const response = await fetch(
			`/api/projects/${data.id}/management/participants/${currentParticipant!.id}`,
			{
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);

		if (response.ok) {
			participants = participants.filter(
				(participant) => participant.id !== currentParticipant!.id
			);
			currentParticipant = null;
		}
	}

	async function validateParticipant() {
		const response = await fetch(`/api/projects/${data.id}/management/validation`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id: currentParticipant!.id })
		});

		if (response.ok) {
			participants = participants.filter(
				(participant) => participant.id !== currentParticipant!.id
			);
			currentParticipant = null;
		}
	}
</script>

<div
	class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
>
	<div class="grid grid-cols-2">
		{#if participants && participants.length > 0}
			<div>
				<h1 class="text-2xl">
					You need to validate the registration of {participants.length} person(s) :
				</h1>
				<table>
					<thead>
						<tr>
							<th>Firstname</th>
							<th>Lastname</th>
							<th>Section</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each participants as participant}
							<tr class="hover:border-blue-700 border cursor-pointer">
								<button on:click={() => (currentParticipant = participant)}>
									<td>{participant.contact.firstName}</td>
									<td>{participant.contact.lastName}</td>
									<td>{participant.section.name}</td>
									<td>
										<span class="icon-[formkit--arrowright] hover:text-black"></span>
									</td>
								</button>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<h1 class="text-2xl">There is no participant to validate</h1>
		{/if}
		{#if currentParticipant}
			<div class="relative border m-1 rounded">
				<div class={currentParticipant.contact.validated ? '' : 'opacity-10'}>
					<h1 class="text-2xl w-full text-center">Participant request :</h1>
					<div>
						<h2 class="text-2xl">Contact :</h2>
						<div class="border">
							<div>
								<span class="text-lg">Name :</span>
								<span
									>{currentParticipant.contact.firstName}
									{currentParticipant.contact.lastName}</span
								>
							</div>
							<div>
								<span class="text-lg">Email :</span>
								<a href="mailto:{currentParticipant.contact.email}"
									>{currentParticipant.contact.email}</a
								>
							</div>
							<div>
								<span class="text-lg">Phone :</span>
								<span>{currentParticipant.contact.phone}</span>
							</div>
							<div>
								<span class="text-lg">Messenger :</span>
								<span>{currentParticipant.contact.messenger}</span>
							</div>
							<div>
								<span class="text-lg">Comments :</span>
								<span>{currentParticipant.contact.comments ?? 'no comments'}</span>
							</div>
						</div>

						<h2 class="text-2xl">Registration form :</h2>
						<div class="border">
							<div>
								<span class="text-lg">Section :</span>
								<span>{currentParticipant.section.name}</span>
							</div>
							<div>
								<span class="text-lg">Custom form :</span>
								{#if currentParticipant.answers.length > 0}
									{#each currentParticipant.answers as answer}
										{#if answer.form}
											<RegistrationForm forms={[]} bind:answer disabled />
										{/if}
									{/each}
								{:else}
									<span>No custom form</span>
								{/if}
							</div>
							<div>
								<AttendancePicker
									concertsOrRehearsals={currentParticipant.rehearsals}
									type="rehearsal"
									participants={[currentParticipant]}
									disabled
								/>
								<AttendancePicker
									concertsOrRehearsals={currentParticipant.concerts}
									type="concert"
									participants={[currentParticipant]}
									disabled
								/>
							</div>
						</div>
					</div>
					<div>
						<button
							class="bg-blue-700 text-white rounded p-1 m-1"
							on:click={() => {
								validateParticipant();
							}}
						>
							Validate
						</button>
						<button
							class="bg-red-700 text-white rounded p-1 m-1"
							on:click={() => {
								deleteParticipant();
							}}
						>
							Refuse and delete participant
						</button>
					</div>
				</div>

				{#if !currentParticipant.contact.validated}
					<div class="absolute top-0">
						<h1 class="text-2xl">You need to validate this persons first !</h1>
						<a href="/contacts/validation" class="text-blue-700">Contact validation page</a>
					</div>
				{/if}
			</div>
		{:else}
			<div class="border m-1 rounded">
				<h1 class="text-2xl">No participant selected</h1>
			</div>
		{/if}
	</div>
</div>
