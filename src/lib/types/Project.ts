import type { Concert } from './Concert';
import type { GenericDataType } from './GenericDataType';
import type { Piece } from './Piece';
import type { Rehearsal } from './Rehearsal';
import type { SectionGroup } from './SectionGroup';

export interface Project {
	id: number | null;
	name: string;
	sectionGroupId: number | null;
	registrationId: number | null;
	rehearsals: Rehearsal[];
	pieces: Piece[];
	sectionGroup: SectionGroup | null;
	concerts: Concert[];
}
