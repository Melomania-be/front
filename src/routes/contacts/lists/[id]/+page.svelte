<script lang="ts">
	import { page } from '$app/stores';
	import ListModifier from '$lib/components/list/ListModifier.svelte';
	import { jsPDF } from 'jspdf';
	import autoTable from 'jspdf-autotable';

	let id: number = parseInt($page.params.id);
	let url = '/api/contacts';
	let urlFront = `/contacts/lists/${id}`;

	async function exportListPdf() {
		// On recupere la liste et ses contacts depuis l'API
		const response = await fetch(`/api/lists/${id}`);
		if (!response.ok) {
			alert('Could not load the list');
			return;
		}
		const list = await response.json();

		const doc = new jsPDF();
		const blue: [number, number, number] = [107, 154, 217];

		// Titre stylise = nom de la liste
		doc.setTextColor(blue[0], blue[1], blue[2]);
		doc.setFontSize(24);
		doc.setFont('helvetica', 'bold');
		doc.text(list.name ?? 'Contact list', 14, 22);

		// Ligne coloree sous le titre
		doc.setDrawColor(blue[0], blue[1], blue[2]);
		doc.setLineWidth(0.8);
		doc.line(14, 26, 196, 26);

		// Date d'export a droite
		doc.setTextColor(120, 120, 120);
		doc.setFontSize(9);
		doc.setFont('helvetica', 'normal');
		const today = new Date().toLocaleDateString('en-GB');
		doc.text(`Exported on ${today}`, 196, 22, { align: 'right' });

		doc.setTextColor(0, 0, 0);

		// On construit une ligne par contact
		const rows = (list.contacts ?? []).map((contact: any) => {
			const instruments = (contact.instruments ?? [])
				.map((i: any) => {
					const level = i.pivot_proficiency_level ? ` (${i.pivot_proficiency_level})` : '';
					return `${i.name ?? ''}${level}`;
				})
				.join(', ');
			return [
				contact.firstName ?? '',
				contact.lastName ?? '',
				contact.email ?? '',
				contact.phone ?? '',
				instruments
			];
		});

		autoTable(doc, {
			startY: 34,
			head: [['First name', 'Last name', 'Email', 'Phone', 'Instruments']],
			body: rows,
			styles: { fontSize: 10, cellPadding: 3 },
			headStyles: { fillColor: blue, textColor: 255, fontStyle: 'bold' },
			alternateRowStyles: { fillColor: [245, 248, 252] }
		});

		doc.save(`list-${id}.pdf`);
	}
</script>

<div class="p-4">
	<div class="flex justify-end mb-2">
		<button
			on:click={exportListPdf}
			class="px-4 py-2 bg-[#6B9AD9] text-white font-semibold rounded-lg shadow hover:bg-[#5a89c8] transition-all"
		>
			Export PDF
		</button>
	</div>
</div>

<ListModifier mode="modify" bind:url bind:urlFront bind:id />