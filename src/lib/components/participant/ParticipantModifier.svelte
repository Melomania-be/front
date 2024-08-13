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
	import SectionPicker from './SectionPicker.svelte';
	import type { Participant } from '$lib/types/Participant';

	export let mode: 'create' | 'modify';
	export let id: string;
	export let currentParticipant: Participant | CustomParticipant;
	export let urlFront: string;

	let allowModification: boolean = mode === 'create' ? true : false;

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
		orderBy: 'firstName'
	};
	let url: string = `/api/contacts`;

	let dataHolder: TableData<Contact>;
	let listContacts: Contact[] = [];

	let participants: (Participant | CustomParticipant)[] = [];

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

	async function updateParticipant() {
		const data = { ...currentParticipant, accepted: true };

		if (!currentParticipant.id) {
			const mailingResponse = await fetch(`/api/mailing/sendParticipationValidationNotifications`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ projectId: id, contactId: currentParticipant.contact!.id })
			});

			if (!mailingResponse.ok) {
				console.error('Failed to send email');
			}
		}

		const response = await fetch(`/api/projects/${id}/management/participants`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});

		if (response.ok) {
			goto(`/projects/${id}/management/participants`);
		} else {
			const error = await response.json();
			alert(error.message);
		}
	}

	async function deleteParticipant() {
		const response = await fetch(
			`/api/projects/${id}/management/participants/${currentParticipant.id}`,
			{
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);

		if (response.ok) {
			goto(`/projects/${id}/management/participants`);
		} else {
			const error = await response.json();
			alert(error.message);
		}
	}

	onMount(async () => {
		const responseForm = await fetch(`/api/registrations/${id}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (responseForm.status === 404) {
			alert('You must create a registration first before adding participants to the project.');
			goto(`/projects/${id}/management/participants`);
		} else if (responseForm.ok) {
			registration = await responseForm.json();

			if (!registration) {
				alert('You must create a registration first before adding participants to the project.');
				goto(`/projects/${id}/management/participants`);
			}

			participants.push(currentParticipant);

			if (currentParticipant && registration && registration.project)
				currentParticipant.project = registration.project;

			if (mode === 'create') {
				currentParticipant.answers = registration.form.map((form) => ({
					formId: form.id!,
					text: ''
				}));

				if (browser) await fetchData();
			}

			if (currentParticipant.concerts) {
				currentParticipant.concerts = currentParticipant.concerts
					.map((concert) => {
						if (!currentParticipant.concerts) currentParticipant.concerts = [];

						if (registration.project) {
							const foundConcert = registration.project.concerts.filter(
								(projectConcert) => projectConcert.id === concert.id
							);

							if (foundConcert.length > 0) {
								return foundConcert[0];
							}
						}

						return null;
					})
					.filter((concert) => concert !== null);
			}

			if (currentParticipant.rehearsals) {
				currentParticipant.rehearsals = currentParticipant.rehearsals
					.map((rehearsal) => {
						if (!currentParticipant.rehearsals) currentParticipant.rehearsals = [];

						if (registration.project) {
							const foundRehearsal = registration.project.rehearsals.filter(
								(projectRehearsal) => projectRehearsal.id === rehearsal.id
							);

							if (foundRehearsal.length > 0) {
								return foundRehearsal[0];
							}
						}

						return null;
					})
					.filter((rehearsal) => rehearsal !== null);
			}

			if (
				registration.project &&
				(!registration.project.sectionGroup ||
					!registration.project.sectionGroup.sections ||
					registration.project.sectionGroup.sections.length === 0)
			) {
				alert(
					`You must create a section group with sections before adding participants to the project. Redirecting...`
				);
				goto(`/section-groups`);
			}
		}
	});

	$: {
		if (currentParticipant) participants = [currentParticipant];
	}
</script>

{#if currentParticipant}
	<div
		class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
	>
		<div>
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

			<div>
				{#if registration?.project && currentParticipant.contact}
					<h1 class="text-2xl uppercase">
						{currentParticipant.contact?.firstName}
						{currentParticipant.contact?.lastName}
					</h1>
					<div class="m-1">
						<h2 class="uppercase">Project form</h2>
						{#if registration.form && currentParticipant.answers.length > 0}
							{#each currentParticipant.answers as answer}
								<RegistrationForm
									bind:forms={registration.form}
									bind:answer
									disabled={!allowModification}
								/>
							{/each}
						{/if}
					</div>
					<div class="m-1">
						{#if registration.project.concerts && registration.project.concerts.length > 0 && participants.length > 0}
							<h2 class="uppercase">Attendance to Concerts</h2>
							<AttendancePicker
								bind:participants
								bind:concertsOrRehearsals={registration.project.concerts}
								type="concert"
								disabled={!allowModification}
							/>
						{/if}
					</div>
					<div class="m-1">
						{#if registration.project.rehearsals && registration.project.rehearsals.length > 0 && participants.length > 0}
							<h2 class="uppercase">Attendance to Rehearsals</h2>
							<AttendancePicker
								bind:participants
								bind:concertsOrRehearsals={registration.project.rehearsals}
								type="rehearsal"
								disabled={!allowModification}
							/>
						{/if}
					</div>
					<div class="m-1">
						{#if registration.project.sectionGroup?.sections && (mode === 'create' || currentParticipant.section)}
							<SectionPicker
								bind:participant={currentParticipant}
								bind:sections={registration.project.sectionGroup.sections}
								disabled={!allowModification}
							/>
						{/if}
					</div>
				{/if}
			</div>

			{#if allowModification}
				<div>
					<button
						on:click={updateParticipant}
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

		{#if listContacts && listContacts.length > 0 && mode === 'create'}
			<SimpleFilterer
				bind:data={dataHolder}
				on:optionsUpdated={fetchData}
				bind:meta
				bind:options
				showData={false}
				buttonLinkId={false}
				editable={false}
				uniqueUrl=""
				selectedData={null}
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
	</div>
{/if}
