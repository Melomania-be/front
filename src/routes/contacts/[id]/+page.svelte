<script lang="ts">
	import type { Instrument } from '$lib/types/Instrument.js';
	import type { Contact } from '$lib/types/Contact.js';
	import DateShow from '$lib/components/DateShow.svelte';
	import ContactModifier from '$lib/components/contact/ContactModifier.svelte';
	import type { Accounting } from '$lib/types/Accounting';
	import AccountingTable from '$lib/components/AccountingTable.svelte';
	import type { ExpenseCategory } from '$lib/types/ExpenseCategory.js';
	import { onMount } from 'svelte';
	import { jsPDF } from 'jspdf';
	import autoTable from 'jspdf-autotable';

	export let data;

	let contact: Contact = structuredClone(data.contact);
	let instruments: Array<Instrument> = structuredClone(data.instruments);

	let contactAccountings: Accounting[] = [];
	let categories: ExpenseCategory[];

	let exportFields = {
		email: true,
		phone: true,
		messenger: true,
		comments: true,
		instruments: true,
		projects: true
	};

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

	function exportPdf() {
		const doc = new jsPDF();

		doc.setFontSize(18);
		doc.text(`${contact.firstName} ${contact.lastName}`, 14, 20);

		const infoRows = [];
		if (exportFields.email) infoRows.push(['Email', contact.email ?? '']);
		if (exportFields.phone) infoRows.push(['Téléphone', contact.phone ?? '']);
		if (exportFields.messenger) infoRows.push(['Messenger', contact.messenger ?? '']);
		if (exportFields.comments) infoRows.push(['Commentaires', contact.comments ?? '']);

		infoRows.push(['Validé', contact.validated ? 'Oui' : 'Non']);
		infoRows.push(['Créé le', contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('fr-BE') : '']);
		infoRows.push(['Modifié le', contact.updatedAt ? new Date(contact.updatedAt).toLocaleDateString('fr-BE') : '']);

		autoTable(doc, {
			startY: 30,
			head: [['Champ', 'Valeur']],
			body: infoRows,
			styles: { fontSize: 11 },
			headStyles: { fillColor: [107, 154, 217] }
		});

		if (exportFields.instruments) {
			const instrumentRows = (contact.instruments ?? []).map((i) => [
				i.name ?? '',
				i.pivot_proficiency_level ?? ''
			]);

			if (instrumentRows.length > 0) {
				autoTable(doc, {
					head: [['Instrument', 'Niveau']],
					body: instrumentRows,
					styles: { fontSize: 11 },
					headStyles: { fillColor: [107, 154, 217] }
				});
			}
		}

		if (exportFields.projects) {
			const projectRows = (contact.participants ?? []).map((p) => [
				p.project?.name ?? ''
			]);

			if (projectRows.length > 0) {
				autoTable(doc, {
					head: [['Projets joués']],
					body: projectRows,
					styles: { fontSize: 11 },
					headStyles: { fillColor: [107, 154, 217] }
				});
			}
		}

		doc.save(`contact-${contact.id}.pdf`);
	}
</script>

<div class="bg-[#E7E7E7] p-4 h-screen">
	<ContactModifier mode="modify" {contact} {instruments} />
	<div class="w-full mt-4 p-4 bg-white border-2 border-gray-500 rounded-xl shadow">
		<p class="font-semibold text-gray-600 mb-2">Champs à exporter :</p>
		<div class="flex flex-wrap gap-4 mb-4">
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={exportFields.email} /> Email
			</label>
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={exportFields.phone} /> Téléphone
			</label>
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={exportFields.messenger} /> Messenger
			</label>
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={exportFields.comments} /> Commentaires
			</label>
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={exportFields.instruments} /> Instruments
			</label>
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={exportFields.projects} /> Projets
			</label>
		</div>
		<div class="flex justify-end">
			<button
				on:click={exportPdf}
				class="px-4 py-2 bg-[#6B9AD9] text-white font-semibold rounded-lg shadow hover:bg-[#5a89c8] transition-all"
			>
				Export PDF
			</button>
		</div>
	</div>
	<div
		class="w-full p-4 mt-4 bg-white border-2 border-gray-500 rounded-xl shadow dark:bg-gray-800 dark:border-gray-700"
	>
		<div class="mb-4">
			<h1 class="w-full text-center m-1 text-lg uppercase font-bold text-gray-600">Sections and Recruitments</h1>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
			{#each contact.participants as participant}
				<div
					class="group text-sm block p-4 bg-white border-2 border-gray-300 rounded-lg shadow hover:shadow-md hover:border-[#6B9AD9] dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-all"
				>
					<h6 class="mb-3 font-bold text-base tracking-tight text-gray-900 dark:text-white border-b pb-2">
						{participant.project.name}
					</h6>
					<div class="space-y-2">
						<p class="text-gray-700 dark:text-gray-300 flex items-center gap-2">
							<span class="font-semibold min-w-[140px]">Section:</span>
							<span class="text-[#6B9AD9] font-semibold">{participant.section.name}</span>
						</p>
						<p class="text-gray-700 dark:text-gray-300 flex items-center gap-2">
							<span class="font-semibold min-w-[140px]">Last activity:</span>
							<DateShow bind:startTime={participant.lastActivity} />
						</p>
						{#if projectConcerts && projectConcerts.get(participant.project.id)}
							<p class="text-gray-700 dark:text-gray-300 flex items-center gap-2">
								<span class="font-semibold min-w-[140px]">Last Concert:</span>
								<DateShow startTime={new Date(projectConcerts.get(participant.project.id))} />
							</p>
						{/if}
					</div>
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