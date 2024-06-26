import type { GenericDataType } from './GenericDataType';
import type { Piece } from './Piece';
import type { Rehearsal } from './Rehearsal';
import type { SectionGroup } from './SectionGroup';

export interface Project  {
	id: number;
	name: string;
	sectionGroupId: number;
	registrationId: number;
	rehearsals: Rehearsal[];
	pieces: Piece[];
	sectionGroup: SectionGroup;
	concerts: any[]
}
