import type { GenericDataType } from './GenericDataType';

export type TableData<DataType extends GenericDataType> = {
	data: DataType[];
	columns: columnFinder<DataType>
	notOrderedColumns: columnFinder<DataType>
};

type columnFinder<DataType extends GenericDataType> =
	{
		[Key in keyof DataType]: DataType[Key] extends Array<GenericDataType>
			? never
			: DataType[Key] extends GenericDataType
				? never
				: Key;
	}[keyof DataType][];