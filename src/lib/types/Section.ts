import type { GenericDataType } from './GenericDataType';
import type { Instrument } from './Instrument';

export interface Section {
	id: number | null;
	name: string;
	size: number;
	instruments: Instrument[];
}
