import type { Answer } from './Answer';
import type { Callsheet } from './Callsheet';
import type { Composer } from './Composer';
import type { Contact } from './Contact';
import type { ContentCallsheet } from './ContentCallsheet';
import type { ContentRegistration } from './ContentRegistration';
import type { Folder } from './Folder';
import type { Form } from './Form';
import type { Instrument } from './Instrument';
import type { Piece } from './Piece';
import type { Project } from './Project';
import type { Registration } from './Registration';
import type { Rehearsal } from './Rehearsal';
import type { Section } from './Section';
import type { SectionGroup } from './SectionGroup';
import type { TypeOfPiece } from './TypeOfPiece';
import type { File } from './File';
import type { CustomContact } from './CustomContact';
import type { List } from './List';
import type { CustomList } from './CustomList';
import type { Participant } from './Participant';

export type GenericDataType =
	| Answer
	| Callsheet
	| Composer
	| Contact
	| ContentCallsheet
	| ContentRegistration
	| File
	| Folder
	| Form
	| Instrument
	| Piece
	| Project
	| Registration
	| Rehearsal
	| Section
	| SectionGroup
	| TypeOfPiece
	| CustomContact
	| List
	| CustomList
	| Participant;
