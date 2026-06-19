export interface Accounting {
	id: number;
	billDate: Date | null;
	paymentDate: Date | null;
	name: string;
	amount: number;
	categoryId: number;
	attachment: string | null;
	projectId: number;
	contactId: number | null;
	isIndividualPayment: boolean;
	isMusicianFee: boolean;
}
