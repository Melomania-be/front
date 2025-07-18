import type { Composer } from './Composer';
import type { Folder } from './Folder';
import type { File } from './File'; // ✅ AJOUT : Import du type File
import type { GenericDataType } from './GenericDataType';
import type { TypeOfPiece } from './TypeOfPiece';

export interface Piece {
	pivot_order?: Number;
	arranger: String;
	composer: Composer;
	composerId: Number;
	folder: Folder;
	folderId: Number;
	files?: File[]; // ✅ AJOUT : Propriété files pour les fichiers liés directement à la pièce
	CreatedAt: Date;
	id: Number;
	name: String;
	opus: String;
	typeOfPiece: TypeOfPiece;
	typeOfPieceId: Number;
	updatedAt: Date;
	yearOfComposition: string;
}