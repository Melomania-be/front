<script lang="ts">
	import type { Instrument } from '$lib/types/Instrument.js';
	import type { Contact } from '$lib/types/Contact.js';
	import DateShow from '$lib/components/DateShow.svelte';
	import ContactModifier from '$lib/components/contact/ContactModifier.svelte';
	import type { Accounting } from '$lib/types/Accounting';
	import AccountingTable from '$lib/components/AccountingTable.svelte';
	import type { ExpenseCategory } from '$lib/types/ExpenseCategory.js';
	import { onMount } from 'svelte';
	import autoTable from 'jspdf-autotable';

	export let data;

	let contact: Contact = structuredClone(data.contact);
	let instruments: Array<Instrument> = structuredClone(data.instruments);

	let contactAccountings: Accounting[] = [];
	let categories: ExpenseCategory[];

	onMount(async () => {
		await fetchAccountingContact();
		await fetchCategories();
		console.log(contactAccountings);
	});

	async function fetchCategories() {
		const res = await fetch('/api/expense_categories');

		if (!res.ok) {
			console.error('Erreur lors de la récupération des catégories');
			return;
		}

		categories = (await res.json()) as ExpenseCategory[];
		console.log(categories);
	}

	async function fetchAccountingContact() {
		if (contact.id) {
			const response = await fetch(`/api/accountings/${contact.id}`, {
				method: 'GET'
			});
			if (!response.ok) {
				return;
			}

			contactAccountings = await response.json();
		}
	}

	let projectConcerts: Map<number, Date> = new Map();

	async function fetchProject(projectId: number) {
		if (!contact.id || projectConcerts.has(projectId)) return;

		const response = await fetch(`/api/projects/${projectId}`);
		if (!response.ok) return;

		const data = await response.json();

		if (Array.isArray(data.concerts) && data.concerts.length > 0) {
			const sortedConcerts = data.concerts
				.map((c) => new Date(c.startDate))
				.sort((a, b) => b.getTime() - a.getTime());

			projectConcerts.set(projectId, sortedConcerts[0]);
			projectConcerts = new Map(projectConcerts);
		}
	}

	onMount(() => {
		if (contact?.participants?.length) {
			for (const participant of contact.participants) {
				const projectId = participant.project?.id;
				if (projectId) {
					fetchProject(projectId);
				}
			}
		}
		console.log(projectConcerts)
	});
</script>

<div class="bg-[#E7E7E7] p-4 h-screen">
	<ContactModifier mode="modify" {contact} {instruments} />
	<div
		class="w-full p-4 mt-4 bg-white border-2 border-gray-500 rounded-xl shadow dark:bg-gray-800 dark:border-gray-700"
	>
		<div class="mb-4">
			<h1 class="w-full text-center m-1 text-lg uppercase font-bold text-gray-600">Projects</h1>
		</div>

		<div class="grid grid-cols-2 w-full">
			{#each contact.participants as participant}
				<div
					class="group text-sm *:break-words block mr-1 mt-1 p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 hover:max-h-full *:[&:not(:hover)]:truncate"
				>
					<h6 class="mb-2 font-bold tracking-tight text-gray-900 dark:text-white">
						{participant.project.name}
					</h6>
					<p class="text-gray-700 dark:text-gray-300">In section : {participant.section.name}</p>
					<p class="text-gray-700 dark:text-gray-300">
						Last activity seen : <DateShow bind:startTime={participant.lastActivity} />
					</p>
					{#if projectConcerts}
						<p class="text-gray-700 dark:text-gray-300">
							Last Concert Date : <DateShow startTime={new Date(projectConcerts.get(participant.project.id))} />
						</p>
					{/if}
					
				</div>
			{/each}
		</div>
	</div>
	<div class="w-full mt-4 bg-white border-2 border-gray-500 rounded-xl shadow">
		<div class="p-5">
			<h3 class="w-full text-center m-1 text-lg uppercase font-bold text-gray-600">Accounting</h3>
			<AccountingTable
				accountings={contactAccountings}
				bind:categories
				showAttachments={false}
				showStatistic={false}
				showProject={true}
				bind:contact
				bind:projectConcerts
			></AccountingTable>
		</div>
	</div>
</div>
