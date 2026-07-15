<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import DateShow from '$lib/components/DateShow.svelte';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import type { Participant } from '$lib/types/Participant';
	import type { TableData } from '$lib/types/TableData';
	import { onMount } from 'svelte';
	import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';
	import type { Project } from '$lib/types/Project';
	import ProjectPhoneDisplayer from '../ProjectPhoneDisplayer.svelte';
	import type { Accounting } from '$lib/types/Accounting';
	import { DivideSquare } from 'lucide-svelte';
	import RegistrationForm from '$lib/components/registration/RegistrationForm.svelte';
	import type { Registration } from '$lib/types/Registration';
	import type { Form } from '$lib/types/Form';
	import { jsPDF } from 'jspdf';
	import autoTable from 'jspdf-autotable';
    import { sortParticipantsBySection } from '$lib/utils/sectionOrder';
	export let data;

	let project: Project | undefined;

	let participants: Participant[] = [];
	let participantNotValidated: number = 0;
	let participantanswers: any;
let contractorParticipants = [];
let contractors = [];
	let registration: Registration;
let showAddContractor = false;
let selectedContractorId: number | null = null;
	let answers: any[] = [];

	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 250,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};

	let HeadTable: Record<string, boolean> = {
		'first name': true,
		'last name': true,
		email: true,
		phone: true,
		messenger: true,
		section: true,
		'last activity': false,
		'updated at': false
	};
	let HeadTableForm: Record<string, boolean> = {};

	let urlSvelteApi = `/api/projects/${data.id}/management/participants`;
	let urlFront = `/projects/${data.id}/management/participants`;
	let uniqueUrl = `/projects/${data.id}/management/participants`;

	let dataHolder: TableData<Participant>;

	let paymentsByContactMusicianFee: Record<number, number> = {};
	let paymentsByContactAdditionnal: Record<number, number> = {};

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);

		options = {
			filter: urlParams.get('filter') || options.filter,
			limit: parseInt(urlParams.get('limit') || options.limit.toString()),
			page: parseInt(urlParams.get('page') || options.page.toString()),
			order: urlParams.get('order') || options.order,
			orderBy: urlParams.get('orderBy') || options.orderBy
		};

		await fetchProject();
		await fetchData();
		await fetchContractorParticipants();
		await fetchContractors();
		await fetchAccountingContact();
		console.log(accountings)

		if (project?.participants) {
			for (const p of project.participants) {
				if (!p.accepted) {
					participantNotValidated++;
				}
			}
		}

		try {
			const response = await fetch(`/api/projects/${data.id}/management/participants/answers`);
			if (!response.ok) {
				throw new Error(`Failed to fetch answers: ${response.status}`);
			}
			participantanswers = await response.json();
		} catch (error) {
			console.error(error);
		}

		const registrationResponse = await fetch(`/api/registrations/${data.id}`, {
			method: 'GET'
		});

		if (registrationResponse.ok) {
			const data = await registrationResponse.json();

			registration = {
				id: data.id,
				project: data.project,
				contents: data.content,
				form: data.form
			};
		} else {
			const projectResponse = await fetch(`/api/projects/${data.id}`, {
				method: 'GET'
			});

			if (projectResponse.ok) {
				const project = await projectResponse.json();

				registration = {
					id: 0,
					project: project,
					contents: [],
					form: []
				};
			} else {
				alert('An error occured');
			}
		}
		for (const p of participantanswers) {
			answers.push({
				participantId: p.id,
				forms: registration.form,
				answers: p.answers
			});
		}

		for (const form of registration.form) {
			HeadTableForm[form.text] = false;
		}
		console.log(participants);

		for (const acc of accountings) {
			if(acc.isMusicianFee){
				if (acc.contactId != null) {
					if (!paymentsByContactMusicianFee[acc.contactId]) {
						paymentsByContactMusicianFee[acc.contactId] = 0;
					}

					paymentsByContactMusicianFee[acc.contactId] += Number(acc.amount);
				}
				
			}
			else{
				if (acc.contactId != null) {
					if (!paymentsByContactAdditionnal[acc.contactId]) {
						paymentsByContactAdditionnal[acc.contactId] = 0;
					}

					paymentsByContactAdditionnal[acc.contactId] += Number(acc.amount);
				}
				console.log(acc.amount)
			}
		}
		console.log(paymentsByContactAdditionnal , paymentsByContactMusicianFee)
	});

	let accountings : Accounting[];

	async function fetchAccountingContact(){

		const response = await fetch(`/api/projects/${data.id}/management/accounting/participant`, {
			method: 'GET'
		});
		if (!response.ok) {
			return;
		}

		accountings = await response.json();
	}
async function fetchContractorParticipants() {
	const response = await fetch(
		`/api/contractor-participant/project/${data.id}`
	);

	if (!response.ok) {
		return;
	}

	contractorParticipants = await response.json();

	console.log(contractorParticipants);
}

async function fetchContractors() {
	const response = await fetch('/api/contractor');

	if (!response.ok) {
		return;
	}

	contractors = await response.json();

	console.log(contractors);
}

async function addContractorParticipant() {
	if (!selectedContractorId) return;

	const response = await fetch('/api/contractor-participant', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			project_id: data.id,
			contractor_contact_id: selectedContractorId
		})
	});

	if (!response.ok) {
		alert('Failed to add contractor.');
		return;
	}

	await fetchContractorParticipants();

	showAddContractor = false;
	selectedContractorId = null;
}

async function deleteContractorParticipant(id: number) {
	if (!confirm('Remove this contractor from the project?')) {
		return;
	}

	const response = await fetch(
		`/api/contractor-participant/${id}`,
		{
			method: 'DELETE'
		}
	);

	if (!response.ok) {
		alert('Failed to remove contractor.');
		return;
	}

	await fetchContractorParticipants();
}

	async function fetchProject() {
		if (!data?.id) return;

		const response = await fetch(`/api/projects/${data.id}`, {
			method: 'GET'
		});

		if (!response.ok) {
			return;
		}

		project = await response.json();
	}

	async function fetchData() {
		let optionInUrls = `?page=${options.page}&limit=${options.limit}`;
		optionInUrls += '&filter=' + options.filter;
		optionInUrls += '&orderBy=' + options.orderBy;
		optionInUrls += '&order=' + options.order;

		if (browser && data.id) goto(`${urlFront}${optionInUrls}`);

		const response = await fetch(`${urlSvelteApi}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			const data = await response.json();

			participants = data.data;
			meta = data.meta;

			dataHolder = {
				data: participants,
				columns: ['id', 'updatedAt', 'lastActivity'],
				notOrderedColumns: []
			};
		});
	}

	let isMobile = false;

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};

	function findParticipantAnswer(formId: number | null | undefined, participantId: number) {
		let participantsAnswers = answers.find((a) => a.participantId === participantId).answers;
		let formType = answers
			.find((a) => a.participantId === participantId)
			?.forms.find((f) => f.id === formId)?.type;
		if (participantsAnswers.length > 0) {
			let answer = participantsAnswers.find((a) => a.formId === formId);
			if (formType === 'checkbox') {
				return (answer?.text ? 'Yes' : null) ?? 'No';
			}
			if (formType === 'select') {
				return answer?.text ?? '-';
			}
			if (formType === 'multiple') {
				return (
					answer?.text
						.replace(/^;+|;+$/g, '')
						.split(';')
						.map((e) => e.trim())
						.join(' - ') ?? '-'
				);
			}
			if (formType === 'text') {
				return answer?.text ?? '-';
			}
		} else {
			if (formType === 'checkbox') {
				return 'No';
			}
			if (formType === 'select') {
				return '-';
			}
			if (formType === 'multiple') {
				return '-';
			}
			if (formType === 'text') {
				return '-';
			}
		}
	}

	function parseQuestionAndAnswers(raw: string): string {
		const [question, answersPart] = raw.split(':', 2);

		if (!answersPart) return raw;

		const answers = answersPart
			.replace(/^;+|;+$/g, '')
			.split(';')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);

		return `${question.trim()} (${answers.join(', ')})`;
	}

	let sorting: string = '';

	function changeSorting(event : Event) {
		const selected = (event.target as HTMLSelectElement).value;
		sorting = selected;
		console.log(sorting)
		if (sorting === 'email') {
			participants.sort((a, b) => {
				if (!a.contact?.email) return 1;
				if (!b.contact?.email) return -1;
				return a.contact.email.localeCompare(b.contact.email);
			});
		} else if (sorting === 'firstName') {
			participants.sort((a, b) => {
				if (!a.contact?.firstName) return 1;
				if (!b.contact?.firstName) return -1;
				return a.contact.firstName.localeCompare(b.contact.firstName);
			});
		}
		else if (sorting === 'lastName') {
			participants.sort((a, b) => {
				if (!a.contact?.lastName) return 1;
				if (!b.contact?.lastName) return -1;
				return a.contact.lastName.localeCompare(b.contact.lastName);
			});
		}
		participants = [...participants];
		console.log(participants)
			participants.forEach(p => {
		console.log(p.id, p.contact?.email);
	});
	}

	function exportParticipantsPdf() {
		const doc = new jsPDF();
		const blue: [number, number, number] = [107, 154, 217];

		// Titre stylisé
		doc.setTextColor(blue[0], blue[1], blue[2]);
		doc.setFontSize(24);
		doc.setFont('helvetica', 'bold');
		doc.text('Project participants', 14, 22);

		// Ligne colorée sous le titre
		doc.setDrawColor(blue[0], blue[1], blue[2]);
		doc.setLineWidth(0.8);
		doc.line(14, 26, 196, 26);

		// Date d'export à droite
		doc.setTextColor(120, 120, 120);
		doc.setFontSize(9);
		doc.setFont('helvetica', 'normal');
		const today = new Date().toLocaleDateString('en-GB');
		doc.text(`Exported on ${today}`, 196, 22, { align: 'right' });

		// Nom du projet en sous-titre
		doc.setTextColor(60, 60, 60);
		doc.setFontSize(12);
		doc.setFont('helvetica', 'normal');
		if (project?.name) {
			doc.text(project.name, 14, 34);
		}

		doc.setTextColor(0, 0, 0);

		// Tableau des participants
		// Ordre des sections depuis le section group du projet
            const sectionOrderMap = new Map(
                (project?.sectionGroup?.sections ?? []).map((s) => [s.name.trim(), s.pivot_order])
            );
            participants.forEach((p) => {
                if (p.section) {
                    p.section.pivot_order = sectionOrderMap.get(p.section.name?.trim());
                }
            });
		    const sortedParticipants = sortParticipantsBySection(participants);
		    const rows = sortedParticipants.map((p) => {
			const sectionName = p.section?.name ?? '';
			const sectionText = p.isSectionLeader ? `${sectionName} (section leader)` : sectionName;
			return [
				p.contact?.firstName ?? '',
				p.contact?.lastName ?? '',
				p.contact?.email ?? '',
				p.contact?.phone ?? '',
				sectionText
			];
		});

		autoTable(doc, {
			startY: 42,
			head: [['First name', 'Last name', 'Email', 'Phone', 'Section']],
			body: rows,
			styles: { fontSize: 10, cellPadding: 3 },
			headStyles: { fillColor: blue, textColor: 255, fontStyle: 'bold' },
			alternateRowStyles: { fillColor: [245, 248, 252] }
		});

		doc.save(`participants-project-${data.id}.pdf`);
	}
</script>

<ProjectHeadDisplayer {project} selectedTab={1} />
<div class="bg-[#E7E7E7] p-4 min-h-screen pb-[80px]">
	<div class="p-4 gap-4 flex flex-col">
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
			<h1 class="font-bold text-lg mb-2">NEW PARTICIPANTS</h1>
			{#if participantNotValidated}
				<div class="flex items-center {isMobile ? 'flex-col gap-2' : 'px-2'}">
					<p class={isMobile ? '' : ''}>
						You have <strong class="text-red-400 mx-1">{participantNotValidated}</strong>
						{participantNotValidated === 1 ? 'participant' : 'participants'} waiting for validation
						</p>
						<a
					
						href="/projects/{data.id}/management/validation"
						class="ml-auto inline-flex items-center px-3 py-2 text-sm font-semibold text-center text-white bg-[#6B9AD9] rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
					>
						Review Participants
					</a>
				</div>
			{:else if project}
				<p class="px-10">No new participants waiting for validation</p>
			{/if}
		</div>
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
			<div class="flex items-center">
				<h1 class="font-bold text-lg">PARTICIPANTS</h1>
				<button
					on:click={exportParticipantsPdf}
					class="ml-auto px-4 py-2 text-sm bg-[#6B9AD9] text-white rounded-lg font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
				>
					Export PDF
				</button>
				<button
					on:click={() => goto(`${urlFront}/creation`)}
					class="ml-2 px-4 py-2 text-sm bg-[#6B9AD9] text-white rounded-lg font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
				>
					Add a participant
				</button>
			</div>
			<SimpleFilterer
				bind:data={dataHolder}
				bind:meta
				bind:options
				bind:uniqueUrl
				on:optionsUpdated={() => fetchData()}
			>
				<div class="bg-gray-200 rounded-lg w-full border-2 border-gray-400 mb-6 mt-6">
					<div class="flex {isMobile ? "flex-col" : "" }">
						<div class="flex-1 p-4 grid grid-cols-2">
							{#each Object.entries(HeadTable) as [colName, displayed]}
							
								<div class="flex items-center">
									<input
										class="w-4 h-4 accent-[#6b9ad9] active:accent-[#4f7cb7] ml-2 mr-2"
										type="checkbox"
										on:click={() => (HeadTable[colName] = !displayed)}
										bind:checked={displayed}
									/>
									<div class="uppercase text-gray-500 text-sm font-semibold">{colName}</div>
								</div>
							{/each}
						</div>
						<div
							class="mt-4 mb-4 items-center justify-center border-2 rounded-full border-gray-500 {isMobile ? "mx-4" : "" }"
						></div>
						<div class="flex-1 w-full p-4 grid grid-cols-1">
							<p class="font-bold text-gray-600">Forms :</p>
							{#each Object.entries(HeadTableForm) as [colName, displayed]}
								<div class="flex-1 flex items-center">
									<input
										class="w-4 h-4 accent-[#6b9ad9] active:accent-[#4f7cb7] ml-2 mr-2"
										type="checkbox"
										on:click={() => (HeadTableForm[colName] = !displayed)}
										bind:checked={displayed}
									/>
									<div class=" text-gray-500">{parseQuestionAndAnswers(colName)}</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
				<div class="w-full overflow-x-auto">
					<table
						class="w-full min-w-[800px] text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400"
					>
						<thead
							class="bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 uppercase dark:text-gray-400"
						>
							<tr>
								{#each Object.entries(HeadTable) as [colName, displayed]}
									{#if displayed}
										<th class="px-4 py-2">{colName}</th>
									{/if}
								{/each}
								{#each Object.entries(HeadTableForm) as [colName, displayed]}
									{#if displayed}
										<th class="px-4 py-2">{parseQuestionAndAnswers(colName)}</th>
									{/if}
								{/each}
								<th class="px-4 py-2">Payment</th>
							</tr>
						</thead>

						<tbody>
							{#each participants as participant}
								<tr
									on:click={() => goto(uniqueUrl + `/${participant.id}`)}
									class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-700"
								>
									{#each Object.entries(HeadTable) as [colName, displayed]}
										{#if displayed}
											<td class="px-4 py-2">
												{#if colName === 'first name'}
													{participant.contact?.firstName}
												{:else if colName === 'last name'}
													{participant.contact?.lastName}
												{:else if colName === 'email'}
													{participant.contact?.email}
												{:else if colName === 'phone'}
													{participant.contact?.phone}
												{:else if colName === 'messenger'}
													{participant.contact?.messenger}
												{:else if colName === 'section'}
													{participant.section?.name}
													{#if participant.isSectionLeader}
														<span class="text-sm font-bold text-blue-500">(Leader)</span>
													{/if}
												{:else if colName === 'last activity'}
													<DateShow bind:startTime={participant.lastActivity} />
												{:else}
													<DateShow bind:startTime={participant.updatedAt} />
												{/if}
											</td>
										{/if}
									{/each}

									{#each Object.entries(HeadTableForm) as [colName, displayed]}
										{#if displayed}
											<td class="px-4 py-2"
												>{findParticipantAnswer(
													registration.form.find((f) => f.text === colName)?.id,
													participant.id
												)}</td
											>
										{/if}
									{/each}
									<td class="px-4 py-2 font-bold">
										{#if participant.contact.id && (paymentsByContactMusicianFee.hasOwnProperty(participant.contact.id) || paymentsByContactAdditionnal.hasOwnProperty(participant.contact.id))}
											{#if paymentsByContactMusicianFee.hasOwnProperty(participant.contact.id)}
												<span class="text-blue-500 font-bold">{-paymentsByContactMusicianFee[participant.contact.id]} €</span>
											{:else}
												<span class="text-blue-500 font-bold">0 €</span>
											{/if}
											+
											{#if paymentsByContactAdditionnal.hasOwnProperty(participant.contact.id)}
											<span class="text-orange-500 font-bold">{-paymentsByContactAdditionnal[participant.contact.id]} €</span>
											{:else}
												<span class="text-orange-500 font-bold">0 €</span>
											{/if}
										{:else}
											<span class="text-gray-400 font-semibold">0 €</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</SimpleFilterer>
			<div class="mt-8 bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
	<div class="flex items-center justify-between mb-4">
		<h1 class="font-bold text-lg">
	CONTRACTOR PARTICIPANTS
</h1>

<button
	class="bg-[#6B9AD9] text-white px-3 py-2 rounded-lg"
	on:click={() => (showAddContractor = true)}
>
	Add contractor
</button>
	</div>

	<table class="w-full text-left">
		<thead class="border-b">
			<tr>
				<th class="py-2">First name</th>
				<th class="py-2">Last name</th>
				<th class="py-2">Payment</th>
				<th></th>
			</tr>
		</thead>

		<tbody>
			{#each contractorParticipants as participant}
				<tr class="border-b hover:bg-gray-100">
					<td class="py-2">
						{participant.contractor.firstName}
					</td>

					<td class="py-2">
						{participant.contractor.lastName}
					</td>

					<td class="py-2 text-gray-500">
						0 €
					</td>
					<td class="py-2 text-right">
	<button
		class="text-red-600 hover:underline"
		on:click={() =>
			deleteContractorParticipant(participant.id)}
	>
		Delete
	</button>
</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
{#if showAddContractor}

<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

	<div class="bg-white rounded-lg p-6 w-[400px]">

		<h2 class="font-bold text-xl mb-4">
			Add contractor
		</h2>

		<select
			class="w-full border rounded p-2"
			bind:value={selectedContractorId}
		>

			<option value={null}>
				Select contractor...
			</option>

			{#each contractors.filter(
	(contractor) =>
		!contractorParticipants.some(
			(cp) => cp.contractorContactId === contractor.id
		)
) as contractor}

				<option value={contractor.id}>

					{contractor.firstName}
					{contractor.lastName}

				</option>

			{/each}

		</select>

<div class="flex justify-end gap-3 mt-6">

			<button
				on:click={() => (showAddContractor = false)}
			>
				Cancel
			</button>

			<button
				class="bg-[#6B9AD9] text-white px-3 py-2 rounded"
				on:click={addContractorParticipant}
			>
				Add
			</button>

		</div>
	</div>

</div>

{/if}
		</div>
	</div>

	{#if isMobile}
		<ProjectPhoneDisplayer {project} selectedTab={1} />
	{/if}
</div>