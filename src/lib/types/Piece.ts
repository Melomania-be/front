import type { Composer } from './Composer';
import type { Folder } from './Folder';
import type { GenericDataType } from './GenericDataType';
import type { TypeOfPiece } from './TypeOfPiece';

export interface Piece {
	arranger: String;
	composer: Composer;
	composerId: Number;
	folder: Folder;
	folderId: Number;
	CreatedAt: Date;
	id: Number;
	name: String;
	opus: String;
	typeOfPiece: TypeOfPiece;
	typeOfPieceId: Number;
	updatedAt: Date;
	yearOfComposition: string;
}
