import type { ContentCallsheet } from "./ContentCallsheet";
import type { GenericDataType } from "./GenericDataType";
import type { Project } from "./Project";

export interface Callsheet   {
    id: number;
    version: string;
    project_id: number;
    contents: ContentCallsheet[];
    project: Project;
}
