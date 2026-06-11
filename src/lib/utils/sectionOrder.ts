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

export function sortParticipantsBySection<T extends { section: { name: string } }>(
	participants: T[]
): T[] {
	return [...participants].sort((a, b) => {
		return getSectionOrder(a.section.name) - getSectionOrder(b.section.name);
	});
}
