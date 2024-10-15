import type { GenericDataType } from './GenericDataType';
import type { Piece } from './Piece';

export interface Composer {
	birthDate: Date;
	country: String;
	createdAt: Date;
	deathDate: Date;
	id: Number;
	longName: String;
	mainStyle: String;
	shortName: String;
	updatedAt: Date;
	pieces: Array<Piece>;
}
