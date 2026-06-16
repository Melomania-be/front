const SECTION_ORDER: string[] = [
	// Strings
	'first violin',
	'second violin',
	'viola',
	'cello',
	'double bass',
	'harp',

	// Woodwinds
	'piccolo',
	'flute',
	'oboe',
	'english horn',
	'clarinet',
	'bass clarinet',
	'bassoon',
	'contrabassoon',

	// Brass
	'horn',
	'trumpet',
	'trombone',
	'tuba',

	// Percussion
	'timpani',
	'percussion'
];

function getSectionOrder(sectionName: string): number {
	const normalized = sectionName.toLowerCase().trim();
	const index = SECTION_ORDER.findIndex((s) => normalized.includes(s) || s.includes(normalized));
	return index === -1 ? 999 : index;
}

export function sortParticipantsBySection<
	T extends {
		section: {
			pivot_order?: number;
			name: string;
		};
	}
>(participants: T[]): T[] {
	return [...participants].sort((a, b) => {
		const aOrder = a.section.pivot_order ?? getSectionOrder(a.section.name);
		const bOrder = b.section.pivot_order ?? getSectionOrder(b.section.name);
		return aOrder - bOrder;
	});
}
