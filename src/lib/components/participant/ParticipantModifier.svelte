<script lang="ts">
	import { goto } from '$app/navigation';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import type { Contact } from '$lib/types/Contact';
	import type { Instrument } from '$lib/types/Instrument';
	import type { Participant } from '$lib/types/Participant';
	import DateShow from '../DateShow.svelte';

	export let participant: Participant;
	export let instruments: Array<Instrument>;
	export let mode: 'modify' | 'create';
	let allowModification = mode === 'modify' ? false : true;
	let addInstrument: Instrument = {
		id: null,
		name: '',
		family: '',
		createdAt: null,
		updatedAt: null,
		pivot_proficiency_level: ''
	};

	async function deleteParticipant() {
		let response = await fetch(`/api/contacts/${participant.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		const requestHandler = new ResponseHandlerClient();

		requestHandler.handle(response, () => {
			window.location.reload();
		});
	}

	async function modifyParticipant() {

		let response = await fetch('/api/contacts/', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({})
		});

		const requestHandler = new ResponseHandlerClient();

		requestHandler.handle(response, async () => {
			goto(`/contacts/${(await response.json()).id}`);
		});
	}
</script>

<div
	class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
>
	{#if mode === 'modify'}
		<div class="absolute top-0 right-0 p-1">
			<button
				on:click={() => (allowModification = !allowModification)}
				class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
			>
				{#if !allowModification}
					<span class="icon-[tabler--edit]" style="width: 1.2rem; height: 1.2rem; color: black;"
					></span>
				{:else}
					Stop editing
				{/if}
			</button>
		</div>
	{/if}

	<div class="p-5">
		<div
			class="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white grid grid-cols-2"
		>
			<input
				class="text-right mr-0.5"
				bind:value={participant.firstName}
				placeholder="Their first name"
				disabled={!allowModification}
			/>
			<input
				class="ml-0.5"
				bind:value={participant.lastName}
				placeholder="Their last name"
				disabled={!allowModification}
			/>
		</div>
		<div>
			<h3 class="w-full text-center m-1">Contact informations</h3>
			<div class="m-1">
				{#if !allowModification}
					<a
						href="mailto:{participant.email}"
						class="font-medium text-blue-600 dark:text-blue-500 hover:underline">{participant.email}</a
					>
				{:else}
					<input bind:value={participant.email} placeholder="Their email" />
				{/if}
			</div>
			<div class="m-1">
				<input
					bind:value={participant.phone}
					placeholder="Their phone number"
					disabled={!allowModification}
				/>
			</div>
			<div class="m-1">
				<input
					bind:value={participant.messenger}
					placeholder="Their messenger"
					disabled={!allowModification}
				/>
			</div>
			<div>
				<h3 class="w-full text-center m-1">Comments</h3>
				<textarea
					id="message"
					rows="4"
					class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
					placeholder="Write your comments here..."
					disabled={!allowModification}
					bind:value={participant.comments}
				></textarea>
			</div>
		</div>
		<div class="w-full">
			<h3 class="w-full text-center m-1">Instruments</h3>

			<table
				class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border"
			>
				<tbody>
					{#each participant.instruments as instrument}
						<tr class="even:bg-slate-200">
							<th>
								{instrument.name}
							</th>
							<th>
								{instrument.family}
							</th>
							<th>
								{instrument.pivot_proficiency_level}
							</th>
							{#if allowModification}
								<th>
									<button
										on:click={() => {
											participant.instruments.splice(participant.instruments.indexOf(instrument), 1);
											allowModification = !allowModification;
											allowModification = !allowModification;
										}}
										class="text-blue-700 hover:text-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:text-blue-500 dark:hover:text-blue-600 dark:focus:ring-blue-800"
										>Delete</button
									>
								</th>
							{:else}
								<th></th>
							{/if}
						</tr>
					{/each}
					{#if allowModification}
						<tr class="bg-neutral-300">
							<th colspan="2">
								{#if instruments}
									<select bind:value={addInstrument}>
										<option value="none">none</option>
										{#each instruments as instrument}
											<option value={instrument}>{instrument.name}</option>
										{/each}
									</select>
								{/if}
							</th>
							<th>
								{addInstrument.family}
							</th>
							<th>
								<input placeholder="level" bind:value={addInstrument.pivot_proficiency_level} />
							</th>
							<th>
								<button
									class="text-blue-700 hover:text-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:text-blue-500 dark:hover:text-blue-600 dark:focus:ring-blue-800"
									on:click={() => {
										participant.instruments.push(addInstrument);
										allowModification = !allowModification;
										allowModification = !allowModification;
									}}>Add</button
								>
							</th>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>

		{#if mode === 'modify'}
			<div>
				<h3 class="w-full text-center m-1">Other</h3>
				<div>
					{#if participant.recommendation_pending}
						<span class="text-red-500">recommendation pending</span>
					{/if}
				</div>
				<div>
					{#if participant.validated}
						<span class="text-green-500">validated</span>
					{:else}
						<span class="text-red-500">not validated</span>
					{/if}
				</div>

				<div>
					last updated at : {#if participant.updatedAt}
						<DateShow bind:date={participant.updatedAt} />
					{/if}
				</div>

				<div>
					created at : {#if participant.createdAt}
						<DateShow bind:date={participant.createdAt} />
					{/if}
				</div>
			</div>
		{/if}

		{#if allowModification}
			<div>
				<button
					on:click={modifyParticipant}
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
				>
					Save
				</button>
				{#if mode == 'modify'}
					<button
						on:click={deleteParticipant}
						class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
					>
						Delete
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>
