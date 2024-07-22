import type { Callsheet } from './Callsheet';
import type { Concert } from './Concert';
import type { Contact } from './Contact';
import type { Folder } from './Folder';
import type { GenericDataType } from './GenericDataType';
import type { Piece } from './Piece';
import type { Rehearsal } from './Rehearsal';
import type { SectionGroup } from './SectionGroup';

export interface Project {
	id: number | null;
	name: string;
	sectionGroupId: number | null;
	rehearsals: Rehearsal[];
	pieces: Piece[];
	sectionGroup: SectionGroup | null;
	concerts: Concert[];
	responsibles: Contact[];
	folder?: Folder;
	callsheets?: Callsheet[];
	participants?: Contact[];
}
