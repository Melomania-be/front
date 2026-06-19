// src/lib/utils/compactPdfGenerator.ts
import { jsPDF } from 'jspdf';
import type { Project } from '$lib/types/Project';
import type { Concert } from '$lib/types/Concert';
import type { Rehearsal } from '$lib/types/Rehearsal';
import type { Participant } from '$lib/types/Participant';

interface AttendanceData {
	project: Project;
	concerts: Concert[];
	rehearsals: Rehearsal[];
	participants: Participant[];
	laxInclude: (participant: Participant, event: Concert | Rehearsal) => boolean;
}

function addPageNumber(doc: jsPDF, pageNumber: number): void {
	doc.setFontSize(10);
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(0, 0, 0);
	doc.text(`Page ${pageNumber}`, 20, 200);
}

function formatDate(dateString: string | Date): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('fr-FR', {
		day: '2-digit',
		month: '2-digit'
	});
}

function formatTime(dateString: string | Date): string {
	const date = new Date(dateString);
	return date.toLocaleTimeString('fr-FR', {
		hour: '2-digit',
		minute: '2-digit'
	});
}

function truncatePlace(place: string, maxLength: number = 8): string {
	if (!place || place.length <= maxLength) return place || 'Event';

	// Troncature intelligente - garder le début + voyelles importantes
	const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
	let result = place.substring(0, Math.min(4, maxLength - 1));

	// Ajouter des consonnes importantes du milieu/fin si possible
	if (place.length > 4 && maxLength > 5) {
		const remaining = place.substring(4);
		const consonants = remaining
			.split('')
			.filter((char) => !vowels.includes(char.toLowerCase()) && /[a-zA-Z]/.test(char));

		if (consonants.length > 0) {
			const extraChars = Math.min(consonants.length, maxLength - result.length - 1);
			result += consonants.slice(0, extraChars).join('');
		}
	}

	return result + '.';
}

function groupParticipantsBySection(participants: Participant[]): Map<string, Participant[]> {
	const sections = new Map<string, Participant[]>();

	participants.forEach((participant) => {
		const sectionName = participant.section.name;
		if (!sections.has(sectionName)) {
			sections.set(sectionName, []);
		}
		sections.get(sectionName)!.push(participant);
	});

	const sortedSections = new Map([...sections.entries()].sort(([a], [b]) => a.localeCompare(b)));
	sortedSections.forEach((participants) => {
		participants.sort((a: Participant, b: Participant) =>
			`${a.contact.firstName} ${a.contact.lastName}`.localeCompare(
				`${b.contact.firstName} ${b.contact.lastName}`
			)
		);
	});

	return sortedSections;
}

function addHeader(
	doc: jsPDF,
	project: Project,
	pageNumber: number = 1,
	showTitle: boolean = false
): number {
	if (showTitle) {
		doc.setDrawColor(0, 0, 0);
		doc.setLineWidth(0.8);
		doc.rect(20, 15, 257, 30, 'S');

		doc.setFontSize(18);
		doc.setFont('helvetica', 'bold');
		doc.text('ATTENDANCE REPORT', 148.5, 25, { align: 'center' });

		doc.setFontSize(12);
		doc.setFont('helvetica', 'normal');
		doc.text(`Project: ${project?.name || 'Unknown Project'}`, 25, 35);

		doc.setFontSize(10);
		doc.text(`Generated on: ${new Date().toLocaleDateString('fr-FR')}`, 25, 42);

		return 55;
	} else {
		return 25;
	}
}

function createCompactEventsTable(
	doc: jsPDF,
	events: (Concert | Rehearsal)[],
	participants: Participant[],
	project: Project,
	laxInclude: (participant: Participant, event: Concert | Rehearsal) => boolean,
	startY: number,
	title: string,
	pageNumber: number = 1
): number {
	if (events.length === 0) return startY;

	let currentY = startY;

	// Titre de section
	doc.setFontSize(14);
	doc.setFont('helvetica', 'bold');
	doc.text(title.toUpperCase(), 20, currentY);
	currentY += 12;

	const sectionGroups = groupParticipantsBySection(participants);

	// Calculer les dimensions - ULTRA COMPACT
	const startX = 20;
	const nameColWidth = 60; // Réduit de 75 à 60
	const sectionColWidth = 20; // Réduit de 25 à 20
	const availableWidth = 257 - nameColWidth - sectionColWidth; // 177mm disponible
	const minEventColWidth = 14; // Augmenté à 14mm pour éviter que les dates se touchent

	// LIMITATION SPÉCIALE pour les répétitions : maximum 9 colonnes pour le premier tableau
	let maxEventsPerTable;
	if (title.toLowerCase().includes('rehearsal')) {
		maxEventsPerTable = 9; // Limite fixe pour les répétitions
	} else {
		maxEventsPerTable = Math.floor(availableWidth / minEventColWidth); // ~12 événements max pour les concerts
	}

	// Diviser en chunks si nécessaire
	for (let i = 0; i < events.length; i += maxEventsPerTable) {
		const eventChunk = events.slice(i, i + maxEventsPerTable);
		currentY = createSingleCompactTable(
			doc,
			eventChunk,
			participants,
			project,
			laxInclude,
			currentY,
			title,
			sectionGroups,
			i > 0,
			pageNumber
		);

		if (i + maxEventsPerTable < events.length) {
			doc.addPage();
			pageNumber++;
			currentY = addHeader(doc, project, pageNumber, false);
			addPageNumber(doc, pageNumber);
			doc.setFontSize(14);
			doc.setFont('helvetica', 'bold');
			doc.text(`${title.toUpperCase()} (continued)`, 20, currentY);
			currentY += 12;
		}
	}

	return currentY;
}

function createSingleCompactTable(
	doc: jsPDF,
	events: (Concert | Rehearsal)[],
	participants: Participant[],
	project: Project,
	laxInclude: (participant: Participant, event: Concert | Rehearsal) => boolean,
	startY: number,
	title: string,
	sectionGroups: Map<string, Participant[]>,
	isContinuation: boolean,
	pageNumber: number = 1
): number {
	let currentY = startY;

	const startX = 20;
	const nameColWidth = 60;
	const sectionColWidth = 20;
	const availableWidth = 257 - nameColWidth - sectionColWidth;
	const eventColWidth = availableWidth / events.length; // Distribution équitable
	const totalWidth = nameColWidth + sectionColWidth + eventColWidth * events.length;

	// EN-TÊTE LIGNE 1 - Noms des lieux (TRÈS COMPACT)
	doc.setFillColor(240, 240, 240);
	doc.rect(startX, currentY, totalWidth, 14, 'FD'); // Hauteur réduite à 14
	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(0.8);
	doc.rect(startX, currentY, totalWidth, 14, 'S');

	doc.setFontSize(9); // Police réduite
	doc.setFont('helvetica', 'bold');
	doc.text('Participant', startX + 1, currentY + 9);
	doc.text('Section', startX + nameColWidth + 1, currentY + 9);

	// Noms des événements - TRONQUÉS et CENTRÉS
	let headerX = startX + nameColWidth + sectionColWidth;
	events.forEach((event) => {
		const truncatedPlace = truncatePlace(event.place, Math.floor(eventColWidth / 1.2)); // Ajustement dynamique
		const textWidth = doc.getTextWidth(truncatedPlace);
		const centerX = headerX + (eventColWidth - textWidth) / 2;
		doc.text(truncatedPlace, centerX, currentY + 9);

		doc.setLineWidth(0.8);
		doc.line(headerX, currentY, headerX, currentY + 14);
		headerX += eventColWidth;
	});

	doc.line(startX + nameColWidth, currentY, startX + nameColWidth, currentY + 14);
	doc.line(
		startX + nameColWidth + sectionColWidth,
		currentY,
		startX + nameColWidth + sectionColWidth,
		currentY + 14
	);

	currentY += 14;

	// EN-TÊTE LIGNE 2 - Dates et heures (ENCORE PLUS COMPACT)
	doc.setFillColor(250, 250, 250);
	doc.rect(startX, currentY, totalWidth, 10, 'FD'); // Hauteur réduite à 10
	doc.setLineWidth(0.8);
	doc.rect(startX, currentY, totalWidth, 10, 'S');

	doc.setFontSize(7); // Police très petite
	doc.setFont('helvetica', 'normal');

	headerX = startX + nameColWidth + sectionColWidth;
	events.forEach((event) => {
		const dateStr = formatDate(event.startDate);
		const timeStr = formatTime(event.startDate);
		const dateTimeStr = `${dateStr} ${timeStr}`;

		// Tronquer si nécessaire
		const maxChars = Math.floor(eventColWidth / 0.8); // Approximation
		const displayText =
			dateTimeStr.length > maxChars ? dateTimeStr.substring(0, maxChars - 1) + '.' : dateTimeStr;

		const textWidth = doc.getTextWidth(displayText);
		const centerX = headerX + (eventColWidth - textWidth) / 2;
		doc.text(displayText, centerX, currentY + 7);

		doc.setLineWidth(0.8);
		doc.line(headerX, currentY, headerX, currentY + 10);
		headerX += eventColWidth;
	});

	doc.line(startX + nameColWidth, currentY, startX + nameColWidth, currentY + 10);
	doc.line(
		startX + nameColWidth + sectionColWidth,
		currentY,
		startX + nameColWidth + sectionColWidth,
		currentY + 10
	);

	currentY += 10;

	// CORPS DU TABLEAU - Lignes très compactes
	let rowIndex = 0;
	sectionGroups.forEach((sectionParticipants, sectionName) => {
		// Séparateur de section (plus petit)
		doc.setFillColor(230, 230, 230);
		doc.rect(startX, currentY, totalWidth, 6, 'FD'); // Hauteur réduite à 6
		doc.setLineWidth(0.8);
		doc.rect(startX, currentY, totalWidth, 6, 'S');

		doc.setFontSize(8);
		doc.setFont('helvetica', 'bold');

		// Tronquer le nom de section si nécessaire
		let sectionDisplayName = sectionName;
		if (sectionDisplayName.length > 6) {
			sectionDisplayName = sectionDisplayName.substring(0, 6) + '.';
		}
		doc.text(sectionDisplayName, startX + 1, currentY + 4.5);
		currentY += 6;

		// Participants de la section
		sectionParticipants.forEach((participant) => {
			const rowHeight = 12; // Hauteur très réduite

			if (rowIndex % 2 === 0) {
				doc.setFillColor(255, 255, 255);
			} else {
				doc.setFillColor(248, 248, 248);
			}
			doc.rect(startX, currentY, totalWidth, rowHeight, 'F');

			doc.setDrawColor(0, 0, 0);
			doc.setLineWidth(0.8);
			doc.rect(startX, currentY, totalWidth, rowHeight, 'S');

			// Nom du participant (TRÈS COMPACT)
			doc.setFontSize(8); // Police réduite
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(0, 0, 0);
			let name = `${participant.contact.firstName} ${participant.contact.lastName}`;
			if (participant.isSectionLeader) name += ' (L)';

			// Tronquer le nom selon la largeur de colonne
			const maxNameChars = Math.floor(nameColWidth / 1.5);
			if (name.length > maxNameChars) {
				name = name.substring(0, maxNameChars - 1) + '.';
			}
			doc.text(name, startX + 1, currentY + 8);

			// Section (abrégée)
			let shortSection = participant.section.name;
			if (shortSection.length > 6) {
				shortSection = shortSection.substring(0, 6) + '.';
			}
			doc.text(shortSection, startX + nameColWidth + 1, currentY + 8);

			// Présences - Symboles TRÈS PETITS
			let cellX = startX + nameColWidth + sectionColWidth;
			events.forEach((event) => {
				const isPresent = laxInclude(participant, event);

				if (isPresent) {
					// Cercle vert très petit
					doc.setFillColor(34, 139, 34);
					const centerX = cellX + eventColWidth / 2;
					const centerY = currentY + rowHeight / 2;
					const radius = Math.min(eventColWidth / 8, rowHeight / 8, 1.5); // Très petit
					doc.circle(centerX, centerY, radius, 'F');
				} else {
					// Croix rouge très petite
					doc.setDrawColor(220, 20, 60);
					doc.setLineWidth(1.5);
					const centerX = cellX + eventColWidth / 2;
					const centerY = currentY + rowHeight / 2;
					const size = Math.min(eventColWidth / 8, rowHeight / 8, 1.5);

					doc.line(centerX - size, centerY - size, centerX + size, centerY + size);
					doc.line(centerX - size, centerY + size, centerX + size, centerY - size);
				}

				// Reset
				doc.setTextColor(0, 0, 0);
				doc.setDrawColor(0, 0, 0);
				doc.setLineWidth(0.8);
				doc.line(cellX, currentY, cellX, currentY + rowHeight);

				cellX += eventColWidth;
			});

			doc.line(startX + nameColWidth, currentY, startX + nameColWidth, currentY + rowHeight);
			doc.line(
				startX + nameColWidth + sectionColWidth,
				currentY,
				startX + nameColWidth + sectionColWidth,
				currentY + rowHeight
			);

			currentY += rowHeight;
			rowIndex++;

			// Vérifier si on a besoin d'une nouvelle page (plus d'espace)
			if (currentY > 180) {
				doc.addPage();
				pageNumber++;
				currentY = addHeader(doc, project, pageNumber, false);
				addPageNumber(doc, pageNumber);
				rowIndex = 0;
				return currentY;
			}
		});
	});

	return currentY + 10;
}

function addCompactSummary(doc: jsPDF, data: AttendanceData, startY: number): number {
	const { project, concerts, rehearsals, participants, laxInclude } = data;

	doc.setDrawColor(0, 0, 0);
	doc.setLineWidth(0.8);
	doc.rect(20, startY, 257, 35, 'S');

	doc.setFontSize(12);
	doc.setFont('helvetica', 'bold');
	doc.text('SUMMARY', 25, startY + 10);

	doc.setFontSize(10);
	doc.setFont('helvetica', 'normal');

	const totalSections = new Set(participants.map((p) => p.section.name)).size;
	doc.text(
		`• ${participants.length} participants across ${totalSections} sections`,
		25,
		startY + 18
	);
	doc.text(
		`• ${concerts.length} concerts and ${rehearsals.length} rehearsals scheduled`,
		25,
		startY + 25
	);

	// Calculer le taux de présence
	let totalPossibleAttendances = 0;
	let totalActualAttendances = 0;

	participants.forEach((participant) => {
		concerts.forEach((concert) => {
			totalPossibleAttendances++;
			if (laxInclude(participant, concert)) totalActualAttendances++;
		});
		rehearsals.forEach((rehearsal) => {
			totalPossibleAttendances++;
			if (laxInclude(participant, rehearsal)) totalActualAttendances++;
		});
	});

	const attendanceRate =
		totalPossibleAttendances > 0
			? Math.round((totalActualAttendances / totalPossibleAttendances) * 100)
			: 0;

	doc.text(`• Overall attendance rate: ${attendanceRate}%`, 25, startY + 32);

	return startY + 45;
}

// Export de la version compacte
export async function generateCompactAttendancePDF(data: AttendanceData): Promise<void> {
	const { project, concerts, rehearsals, participants, laxInclude } = data;

	if (!project || participants.length === 0) {
		throw new Error('No data available for PDF generation');
	}

	const doc = new jsPDF('landscape', 'mm', 'a4');
	let pageNumber = 1;

	let currentY = addHeader(doc, project, pageNumber, true);
	addPageNumber(doc, pageNumber);

	// Concerts
	if (concerts.length > 0) {
		currentY = createCompactEventsTable(
			doc,
			concerts,
			participants,
			project,
			laxInclude,
			currentY,
			'Concerts',
			pageNumber
		);
	}

	// Répétitions
	if (rehearsals.length > 0) {
		if (currentY > 120) {
			doc.addPage();
			pageNumber++;
			currentY = addHeader(doc, project, pageNumber, false);
			addPageNumber(doc, pageNumber);
		}
		currentY = createCompactEventsTable(
			doc,
			rehearsals,
			participants,
			project,
			laxInclude,
			currentY,
			'Rehearsals',
			pageNumber
		);
	}

	// Résumé
	if (currentY > 150) {
		doc.addPage();
		pageNumber++;
		currentY = addHeader(doc, project, pageNumber, false);
		addPageNumber(doc, pageNumber);
	}
	addCompactSummary(doc, data, currentY);

	const fileName = `attendance_compact_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
	doc.save(fileName);
}

// Alias pour compatibilité
export async function generateAttendancePDF(data: AttendanceData): Promise<void> {
	return generateCompactAttendancePDF(data);
}
