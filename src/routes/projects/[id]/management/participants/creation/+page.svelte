<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import type { Contact } from '$lib/types/Contact';
	import type { TableData } from '$lib/types/TableData';
	import { onMount } from 'svelte';
	import RegistrationForm from '$lib/components/registration/RegistrationForm.svelte';
	import AttendancePicker from './AttendancePicker.svelte';
	import type { CustomParticipant } from '$lib/types/CustomParticipant';
	import type { Registration } from '$lib/types/Registration';

	export let data;

	let meta: any = {};
	let options: {
		filter: string;
		limit: number;
		page: number;
		order: 'asc' | 'desc';
		orderBy: string;
	} = {
		filter: '',
		limit: 10,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let url: string = `/api/contacts`;
	let urlFront: string = `/projects/${data.id}/management/participants/creation`;
	let dataHolder: TableData<Contact>;
	let listContacts: Contact[] = [];

	let currentParticipant: CustomParticipant;

	let participants: CustomParticipant[] = [];

	let registration: Registration;

	async function fetchData() {
		let optionInUrls = `?page=${options.page}&limit=${options.limit}`;
		optionInUrls += '&filter=' + options.filter;
		optionInUrls += '&orderBy=' + options.orderBy;
		optionInUrls += '&order=' + options.order;

		if (browser) goto(`${urlFront}${optionInUrls}`);

		const response = await fetch(`${url}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			const data = await response.json();

			listContacts = data.data;
			meta = data.meta;

			dataHolder = {
				data: listContacts,
				columns: ['firstName', 'lastName'],
				notOrderedColumns: []
			};
		});
	}

	async function addParticipant() {
		console.log(currentParticipant);
	}

	onMount(async () => {
		const responseForm = await fetch(`/api/registrations/${data.id}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		const responseHandlerForm = new ResponseHandlerClient();

		await responseHandlerForm.handle(responseForm, async () => {
			registration = await responseForm.json();

			if (!registration) {
				alert('You must create a registration first before adding participants to the project.');
				goto(`/projects/${data.id}/management/participants`);
			}

			currentParticipant = {
				id: null,
				contact: null,
				project: registration.project!,
				answers: [],
				rehearsals: [],
				concerts: [],
				section: null
			};

			participants.push(currentParticipant);
			console.log(registration);
			if (browser) await fetchData();
		});
	});
</script>

<div>
	{#if registration?.project && currentParticipant.contact}
		<div class="m-1">
			<h2 class="uppercase">Project form</h2>
			{#if registration.form}
				{#each registration.form as form}
					<RegistrationForm bind:form bind:answers={currentParticipant.answers} />
				{/each}
			{/if}
		</div>
		<div class="m-1">
			{#if registration.project.concerts}
				<h2 class="uppercase">Attendance to Concerts</h2>
				<AttendancePicker
					bind:participants
					bind:concertsOrRehearsals={registration.project.concerts}
					type="concert"
				/>
			{/if}
		</div>
		<div class="m-1">
			{#if registration.project.rehearsals}
				<h2 class="uppercase">Attendance to Rehearsals</h2>
				<AttendancePicker
					bind:participants
					bind:concertsOrRehearsals={registration.project.rehearsals}
					type="rehearsal"
				/>
			{/if}
		</div>
	{/if}
</div>

<button
	class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
	on:click={addParticipant}
>
	Add the participant
</button>

{#if listContacts && listContacts.length > 0}
	<SimpleFilterer
		bind:data={dataHolder}
		showData={false}
		editable={false}
		on:optionsUpdated={fetchData}
		bind:options
		bind:meta
	>
		<div class="grid grid-cols-4">
			{#each listContacts as contact}
				<button
					class="m-0.5 items-center p-2 border border-gray-200 rounded dark:border-gray-700 {currentParticipant
						.contact?.id === contact.id
						? 'bg-slate-400'
						: ''}"
					on:click={() => {
						currentParticipant.contact = contact;
						participants = participants;
					}}
				>
					<a class="border rounded-xl p-0.5" href="/contacts/{contact.id}">
						{contact.firstName}
						{contact.lastName}
					</a>
					<div>
						{contact.instruments.map((instrument) => instrument.name).join(', ')}
					</div>
				</button>
			{/each}
		</div>
	</SimpleFilterer>
{/if}
