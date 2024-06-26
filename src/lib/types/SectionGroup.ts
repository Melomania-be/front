import type { GenericDataType } from "./GenericDataType";
import type { Section } from "./Section";

export interface SectionGroup  {
    id: number;
    name: string;
    sections: Section[];
};