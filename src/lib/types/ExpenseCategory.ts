export interface ExpenseCategory {
    id: number;
    name : string;
    description : string | null;
    isDefault : boolean;
    color : string | null;
}