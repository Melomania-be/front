<script lang="ts">
	import type { Accounting } from '$lib/types/Accounting';
	import Fa from 'svelte-fa';
	import {
		faPenToSquare,
		faSort,
		faSortDown,
		faSortUp,
		faXmark
	} from '@fortawesome/free-solid-svg-icons';
	import type { ExpenseCategory } from '$lib/types/ExpenseCategory';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import SimpleFilterer from './SimpleFilterer.svelte';
	import type { Contact } from '$lib/types/Contact';
	import type { TableData } from '$lib/types/TableData';
	import { browser } from '$app/environment';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import type { Project } from '$lib/types/Project';

	export let accountings: Accounting[];

	export let categories: ExpenseCategory[];

	export let showStatistic = true;

	const projectId = get(page).params.id;

	let popUpAdd = false;
	let updateMode = false;

	function showPopUpAdd() {
		popUpAdd = true;
		fetchContacts();
	}

	let AccountingName: string | null = null;
	let AccountingBillDate: string = '';
	let AccountingPaymentDate: string = '';
	let AccountingCategory: number | null = null;
	let AccountingAmount: number | null = null;
	let AccountingId: number | null = null;
	let AccountingpaymentToIndiv: boolean = false;

	let AccountingcontactId: Number | null = null;
	let AccountingNamecontactSelected: string = '';
	let AccountingIsMusicianFee : boolean = true;

	let isMobile = false;

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	async function addAccounting() {
		if (!AccountingAmount || !AccountingName) {
			console.log('blblblbl');
			return;
		}
		console.log(AccountingpaymentToIndiv);
		let payload;
		let billDateISO;
		let paymentDateISO;

		if (AccountingBillDate) {
			billDateISO = new Date(AccountingBillDate).toISOString().split('T')[0];
		} else {
			billDateISO = null;
		}
		if (AccountingPaymentDate) {
			paymentDateISO = new Date(AccountingPaymentDate).toISOString().split('T')[0];
		} else {
			paymentDateISO = null;
		}

		if (AccountingNamecontactSelected != '' && AccountingpaymentToIndiv) {
			AccountingName = 'Payment ' + AccountingNamecontactSelected + ' : ' + AccountingName;
		}

		if (!AccountingpaymentToIndiv) {
			AccountingNamecontactSelected = '';
			AccountingcontactId = null;
			AccountingIsMusicianFee = false;
		}

		if (updateMode) {
			payload = {
				id: AccountingId,
				name: AccountingName,
				bill_date: billDateISO,
				payment_date: paymentDateISO,
				amount: AccountingAmount,
				category_id: +AccountingCategory,
				contact_id: AccountingcontactId,
				is_individual_payment: AccountingpaymentToIndiv,
				is_musician_fee : AccountingIsMusicianFee,
				project: {
					id: +projectId
				}
			};
			console.log(payload);
		} else {
			payload = {
				name: AccountingName,
				bill_date: billDateISO,
				payment_date: paymentDateISO,
				amount: AccountingAmount,
				category_id: +AccountingCategory,
				contact_id: AccountingcontactId,
				is_individual_payment: AccountingpaymentToIndiv,
				is_musician_fee : AccountingIsMusicianFee,
				project: {
					id: +projectId
				}
			};
			console.log(payload);
		}

		try {
			const res = await fetch(`/api/projects/${projectId}/management/accounting`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				console.error('Erreur lors de la création de l accounting');
				return;
			}

			const newAccounting: Accounting = await res.json();

			if (updateMode) {
				accountings = accountings
					.map((acc) => (acc.id === newAccounting.id ? newAccounting : acc))
					.sort((a, b) => a.id - b.id); // tri ici
				accountingsDisplayed = accountings;
			} else {
				accountings = [newAccounting, ...accountings].sort((a, b) => a.id - b.id); // tri ici aussi
				accountingsDisplayed = accountings;
			}

			resetInput();
		} catch (error) {
			console.error('Erreur réseau :', error);
		}
	}

	function resetInput() {
		AccountingName = '';
		AccountingBillDate = '';
		AccountingPaymentDate = '';
		AccountingAmount = null;
		AccountingCategory = null;
		AccountingpaymentToIndiv = false;
		AccountingNamecontactSelected = '';
		AccountingcontactId = null;
		AccountingIsMusicianFee = true;
		popUpAdd = false;
		updateMode = false;
	}

	async function deleteAccounting() {
		try {
			const res = await fetch(`/api/projects/${projectId}/management/accounting/${AccountingId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!res.ok) {
				console.error('Erreur lors de la suppression');
				return;
			}

			accountings = accountings.filter((acc) => acc.id !== AccountingId);

			resetInput();
		} catch (error) {
			console.error('Erreur réseau :', error);
		}
	}

	let paid: number = 0;
	let toPaid: number = 0;
	let income: number = 0;

	$: if (accountings) {
		paid = 0;
		toPaid = 0;
		income = 0;
		for (const acc of accountings) {
			if (acc.amount > 0) {
				income += Number(acc.amount);
			} else {
				if (acc.paymentDate) {
					paid += Number(acc.amount);
				} else {
					toPaid += Number(acc.amount);
				}
			}
		}
	}

	let search = '';
	let accountingsDisplayed: Accounting[] = [];

	// Au mount ou lors d'une mise à jour
	$: if (accountings && accountingsDisplayed.length === 0) {
		accountingsDisplayed = [...accountings];
	}

	// Fonction de filtrage
	function filterAccountings(term: string) {
		search = term.toLowerCase().trim();
		let accountingsDisplayed2 = accountings.filter((acc) =>
			acc.name.toLowerCase().includes(search)
		);
		accountingsDisplayed = [...accountingsDisplayed2];
	}

	let sorting: string = 'id';
	let nameSortingIcon = faSort;
	let billDateSortingIcon = faSort;
	let paymentDateSortingIcon = faSort;
	let amountSortingIcon = faSort;
	let categorySortingIcon = faSort;
	let nameIconColor = '#6b7280';
	let billDateIconColor = '#6b7280';
	let paymentDateIconColor = '#6b7280';
	let amountIconColor = '#6b7280';
	let categoryIconColor = '#6b7280';

	function sortAccountingsBy(key: keyof Accounting, ascending = true) {
		console.log(sorting);
		console.log(typeof key);
		let accountingsDisplayed2 = [...accountingsDisplayed].sort((a, b) => {
			const aVal = a[key];
			const bVal = b[key];

			if (aVal == null) return 1;
			if (bVal == null) return -1;

			if (key === 'amount' || key === 'categoryId' || key === 'id') {
				return ascending ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
			}

			// Pour string
			else if (typeof aVal === 'string' && typeof bVal === 'string') {
				return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
			}

			// Pour date string format ISO (ex: '2024-07-16')
			if (
				typeof aVal === 'string' &&
				typeof bVal === 'string' &&
				/^\d{4}-\d{2}-\d{2}$/.test(aVal)
			) {
				return ascending
					? new Date(aVal).getTime() - new Date(bVal).getTime()
					: new Date(bVal).getTime() - new Date(aVal).getTime();
			}

			return 0;
		});
		accountingsDisplayed = [...accountingsDisplayed2];
	}

	let contacts: Contact[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 250,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let url: string = '/api/contacts';

	let dataHolder: TableData<Contact>;

	async function fetchContacts() {
		let optionInUrls = `?page=${options.page}&limit=${options.limit}`;
		optionInUrls += '&filter=' + options.filter;
		optionInUrls += '&orderBy=' + options.orderBy;
		optionInUrls += '&order=' + options.order;

		const response = await fetch(`${url}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			const data = await response.json();

			contacts = data.data;
			displayedContacts = contacts;
			meta = data.meta;

			dataHolder = {
				data: contacts,
				columns: ['firstName', 'lastName'],
				notOrderedColumns: []
			};
		});
	}

	let displayedContacts: Contact[] = [];

	function filterContacts(search: string) {
		console.log(search);
		AccountingcontactId = null;
		let filteredContacts;
		if (search.trim() === '') {
			filteredContacts = [...contacts]; // Affiche tout
		} else {
			filteredContacts = contacts.filter(
				(c) =>
					c.firstName.toLowerCase().includes(search.toLowerCase()) ||
					c.lastName.toLowerCase().includes(search.toLowerCase())
			);
		}
		displayedContacts = [...filteredContacts];
	}

	function isPaymentToIndiv(str: string): boolean {
		return /^Payment\s.+\s:\s.+$/.test(str);
	}
</script>

{#if popUpAdd}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div
			class="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center {isMobile
				? 'w-[90%]'
				: 'w-[60%]'} {AccountingpaymentToIndiv ? 'h-[80%]' : 'h-auto'}  relative"
		>
			<button
				on:click={() => {
					popUpAdd = false;
					resetInput();
				}}
				class="absolute top-2 right-3"
			>
				<Fa icon={faXmark} class="text-[20px]" style="color: #6b7280;" />
			</button>
			<h2 class="text-xl text-gray-500 font-bold mb-8">New</h2>
			<div class="h-full w-full flex">
				<div class="flex flex-col gap-2 items-center w-full">
					<div class="flex gap-2 text-gray-500 items-center font-semibold">
						<input
							bind:checked={AccountingpaymentToIndiv}
							type="checkbox"
							class="w-4 h-4 text-blue-400 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
						/>
						<span>Payment to individual </span>
					</div>
					<div class="w-full h-full {AccountingpaymentToIndiv ? 'flex' : ''}">
						<div class="flex flex-1 flex-col w-full items-center">
							<!--NAME-->

							<div
								class="flex flex-col {isMobile
									? 'w-[70%]'
									: AccountingpaymentToIndiv
										? 'w-[80%]'
										: 'w-[50%]'}"
							>
								<div
									class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
									style="width: fit-content;"
								>
									Name
								</div>
								<textarea
									class="p-2 px-3 border-2 border-gray-500 h-11 rounded-xl focus:outline-none"
									bind:value={AccountingName}
									placeholder="Name"
									required
								/>
							</div>
							<!--BILL DATE-->
							<div
								class="flex flex-col {isMobile
									? 'w-[70%]'
									: AccountingpaymentToIndiv
										? 'w-[80%]'
										: 'w-[50%]'}"
							>
								<div
									class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
									style="width: fit-content;"
								>
									Bill Date
								</div>
								<input
									type="date"
									class="p-2 px-3 border-2 border-gray-500 rounded-xl focus:outline-none"
									bind:value={AccountingBillDate}
									placeholder="Bill Date"
									required
								/>
							</div>
							<!--PAYMENT DATE-->
							<div
								class="flex flex-col {isMobile
									? 'w-[70%]'
									: AccountingpaymentToIndiv
										? 'w-[80%]'
										: 'w-[50%]'}"
							>
								<div
									class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
									style="width: fit-content;"
								>
									Bank Date
								</div>
								<input
									type="date"
									class="p-2 px-3 border-2 border-gray-500 rounded-xl focus:outline-none"
									bind:value={AccountingPaymentDate}
									placeholder="Bill Date"
									required
								/>
							</div>
							<!--AMOUNT-->
							<div
								class="flex flex-col {isMobile
									? 'w-[70%]'
									: AccountingpaymentToIndiv
										? 'w-[80%]'
										: 'w-[50%]'} relative"
							>
								<div
									class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
									style="width: fit-content;"
								>
									Amount
								</div>
								<input
									type="number"
									class="p-2 pr-10 px-3 border-2 border-gray-500 rounded-xl focus:outline-none"
									bind:value={AccountingAmount}
									placeholder="Amount"
									required
								/>
								<span
									class="absolute right-5 top-5 text-gray-500 pointer-events-none font-semibold text-md"
									>€</span
								>
							</div>
							<!-- CATEGORY -->
							<div
								class="flex flex-col {isMobile
									? 'w-[70%]'
									: AccountingpaymentToIndiv
										? 'w-[80%]'
										: 'w-[50%]'} relative mb-8"
							>
								<div
									class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
									style="width: fit-content;"
								>
									Expense Category
								</div>
								<select
									bind:value={AccountingCategory}
									class="p-2 px-3 border-2 border-gray-500 rounded-xl focus:outline-none"
									required
								>
									{#each categories as cat}
										<option value={cat.id}>{cat.name}</option>
									{/each}
								</select>
							</div>
							{#if AccountingpaymentToIndiv}
								<div class="flex items-center gap-2 text-gray-500 font-semibold">
									<input
										type="radio"
										bind:group={AccountingIsMusicianFee}
										value={true}
										class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
									/>
									<div class="mr-6">Musician Fee</div>
									<input
										type="radio"
										bind:group={AccountingIsMusicianFee}
										value={false}
										class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
									/>
									<div>Additional Expenses </div>
								</div>
							{/if}
						</div>
						{#if AccountingpaymentToIndiv}
							<div
								class="border-2 max-h-full h-full min-h-64 border-gray-500 rounded-full flex"
							></div>
							<div class="flex-1 flex flex-col justify-center items-center h-full">
								<!--PERSON NAME-->
								<div
									class="flex flex-col {isMobile
										? 'w-[70%]'
										: AccountingpaymentToIndiv
											? 'w-[80%]'
											: 'w-[50%]'}"
								>
									<div
										class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
										style="width: fit-content;"
									>
										Person Name
									</div>
									<input
										class="p-2 px-3 border-2 border-gray-500 h-11 rounded-xl focus:outline-none"
										bind:value={AccountingNamecontactSelected}
										on:input={() => filterContacts(AccountingNamecontactSelected)}
										placeholder="Person Name"
										required
									/>
								</div>
								<div
									class="rounded-xl my-4 border-2 pt-4 border-gray-400 bg-gray-200 flex w-[95%] h-full"
								>
									<div class="grid grid-cols-2 gap-4 p-4 max-h-[460px] overflow-y-auto w-full">
										{#if contacts}
											{#each displayedContacts as contact}
												<div
													class="flex h-10 items-center p-4 border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 bg-white dark:bg-gray-800"
												>
													<input
														type="radio"
														bind:group={AccountingcontactId}
														on:change={() => {
															AccountingNamecontactSelected =
																contact.firstName + ' ' + contact.lastName;
															console.log(AccountingcontactId);
														}}
														value={contact.id}
														class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
													/>
													<div class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
														{contact.firstName}
														{contact.lastName}
													</div>
												</div>
											{/each}
										{/if}
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
			<div class="w-full gap-8 flex justify-center">
				{#if updateMode}
					<button
						class="mt-4 w-[30%] px-4 py-2 bg-red-400 text-white rounded font-semibold"
						on:click={() => {
							deleteAccounting();
						}}>Delete</button
					>
				{:else}
					<button
						class="mt-4 w-[30%] px-4 py-2 bg-[#6b9ad9] text-white rounded font-semibold"
						on:click={() => {
							popUpAdd = false;
						}}>Cancel</button
					>
				{/if}
				<button
					class="mt-4 w-[30%] px-4 py-2 bg-[#6b9ad9] text-white rounded font-semibold"
					on:click={() => {
						popUpAdd = false;
						addAccounting();
					}}
				>
					{#if updateMode}
						<p>Save</p>
					{:else}
						<p>Add</p>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if categories}
	<div class="grid grid-cols-1 w-full">
		{#if showStatistic}
		<div class="flex mb-6">
			<div class=" {isMobile ? 'w-[60%]' : 'w-[70%]'}">
				{#if accountings && showStatistic}
					<div
						class="h-auto w-full items-center flex {isMobile
							? 'flex-col'
							: ''} gap-4 text-gray-600 font-bold"
					>
						<div class="border-2 w-full rounded-xl border-gray-400 p-2 px-4">
							Paid : <span class="text-blue-500">{-paid} €</span>
						</div>
						<div class="border-2 w-full rounded-xl border-gray-400 p-2 px-4">
							To be paid : <span class="text-red-500"> {-toPaid} € </span>
						</div>
						<div class="border-2 w-full rounded-xl border-gray-400 p-2 px-4">
							Income : <span class="text-green-500">{income} €</span>
						</div>
					</div>
				{/if}
			</div>
			<button
				on:click={() => showPopUpAdd()}
				class="bg-[#6B9AD9] {isMobile
					? 'h-10'
					: ''} px-4 mb-4 rounded-lg text-sm hover:bg-blue-700 text-white font-semibold ml-auto p-2"
				>Add New</button
			>
		</div>
		
			<div class="w-full mb-2">
				<div class="flex items-center {isMobile ? 'w-full' : 'w-[40%]'}  relative">
					<input
						value={search}
						on:input={(e) => filterAccountings(e.target.value)}
						type="text"
						placeholder="Search..."
						class="w-full px-4 py-2 rounded-full border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
					/>
					<button
						class="absolute right-4"
						on:click={() => {
							search = '';
							filterAccountings('');
						}}
					>
						<Fa icon={faXmark} class="text-[16px]" style="color: #9ca3af;" />
					</button>
				</div>
			</div>
		{/if}
		<div class="overflow-x-auto mt-2">
			<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
				<thead
					class="text-xs text-gray-700 uppercase border-b-2 border-gray-300 text-center dark:bg-gray-700 dark:text-gray-400 h-8"
				>
					<tr class="font-semibold text-md">
						<th class="min-w-60">
							<div class="flex relative items-center">
								<p>Name</p>
								<button
									class="absolute left-12"
									on:click={() => {
										if (sorting === 'nameA') {
											sorting = 'nameD';
											sortAccountingsBy('name', false);
										} else if (sorting === 'nameD') {
											sorting = 'id';
											sortAccountingsBy('id');
										} else {
											sorting = 'nameA';
											sortAccountingsBy('name');
										}
									}}
								>
									{#if sorting === 'nameA'}
										<div class="absolute top-[-7px]">
											<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #6b7280;" />
											<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #d1d5db;" />
										</div>
									{:else if sorting === 'nameD'}
										<div class="absolute top-[-7px]">
											<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #d1d5db;" />
											<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #6b7280;" />
										</div>
									{:else}
										<Fa icon={faSort} class="text-[14px]" style="color: #6b7280;" />
									{/if}
								</button>
							</div>
						</th>
						<th class="min-w-24">
							<div class="flex relative items-center">
								<p>Bill Date</p>
								<button
									class="absolute left-[70px]"
									on:click={() => {
										if (sorting === 'billDateA') {
											sorting = 'billDateD';
											sortAccountingsBy('billDate', false);
										} else if (sorting === 'billDateD') {
											sorting = 'id';
											sortAccountingsBy('id');
										} else {
											sorting = 'billDateA';
											sortAccountingsBy('billDate');
										}
									}}
								>
									{#if sorting === 'billDateA'}
										<div class="absolute top-[-7px]">
											<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #6b7280;" />
											<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #d1d5db;" />
										</div>
									{:else if sorting === 'billDateD'}
										<div class="absolute top-[-7px]">
											<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #d1d5db;" />
											<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #6b7280;" />
										</div>
									{:else}
										<Fa icon={faSort} class="text-[14px]" style="color: #6b7280;" />
									{/if}
								</button>
							</div>
						</th>
						<th class="min-w-24">
							<div class="flex relative items-center">
								<p>Bank Date</p>
								<button
									class="absolute left-[70px]"
									on:click={() => {
										if (sorting === 'paymentDateA') {
											sorting = 'paymentDateD';
											sortAccountingsBy('paymentDate', false);
										} else if (sorting === 'paymentDateD') {
											sorting = 'id';
											sortAccountingsBy('id');
										} else {
											sorting = 'paymentDateA';
											sortAccountingsBy('paymentDate');
										}
									}}
								>
									{#if sorting === 'paymentDateA'}
										<div class="absolute top-[-7px]">
											<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #6b7280;" />
											<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #d1d5db;" />
										</div>
									{:else if sorting === 'paymentDateD'}
										<div class="absolute top-[-7px]">
											<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #d1d5db;" />
											<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #6b7280;" />
										</div>
									{:else}
										<Fa icon={faSort} class="text-[14px]" style="color: #6b7280;" />
									{/if}
								</button>
							</div>
						</th>
						<th class="min-w-24">
							<div class="flex relative items-center">
								<p>Amount</p>
								<button
									class="absolute left-[65px]"
									on:click={() => {
										if (sorting === 'amountA') {
											sorting = 'amountD';
											sortAccountingsBy('amount', false);
										} else if (sorting === 'amountD') {
											sorting = 'id';
											sortAccountingsBy('id');
										} else {
											sorting = 'amountA';
											sortAccountingsBy('amount');
										}
									}}
								>
									{#if sorting === 'amountA'}
										<div class="absolute top-[-7px]">
											<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #6b7280;" />
											<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #d1d5db;" />
										</div>
									{:else if sorting === 'amountD'}
										<div class="absolute top-[-7px]">
											<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #d1d5db;" />
											<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #6b7280;" />
										</div>
									{:else}
										<Fa icon={faSort} class="text-[14px]" style="color: #6b7280;" />
									{/if}
								</button>
							</div>
						</th>
						<th class="min-w-28">
							<div class="flex relative items-center">
								<p>Category</p>
								<button
									class="absolute left-[70px]"
									on:click={() => {
										if (sorting === 'categoryA') {
											sorting = 'categoryD';
											sortAccountingsBy('categoryId', false);
										} else if (sorting === 'categoryD') {
											sorting = 'id';
											sortAccountingsBy('id');
										} else {
											sorting = 'categoryA';
											sortAccountingsBy('categoryId');
										}
									}}
								>
									{#if sorting === 'categoryA'}
										<div class="absolute top-[-7px]">
											<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #6b7280;" />
											<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #d1d5db;" />
										</div>
									{:else if sorting === 'categoryD'}
										<div class="absolute top-[-7px]">
											<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #d1d5db;" />
											<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #6b7280;" />
										</div>
									{:else}
										<Fa icon={faSort} class="text-[14px]" style="color: #6b7280;" />
									{/if}
								</button>
							</div>
						</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					{#if accountingsDisplayed}
						{#each accountingsDisplayed as accounting}
							<tr
								class="font-semibold text-gray-400 {accounting.isIndividualPayment
									? (accounting.isMusicianFee ? 'bg-blue-100' : 'bg-orange-100' )
									: ''}"
							>
								<td>{accounting.name}</td>
								<td class="p-1">{accounting.billDate ? accounting.billDate : 'unknown'}</td>
								<td class="p-1">{accounting.paymentDate ? accounting.paymentDate : 'unpaid'}</td>
								<td class="p-1">
									{#if accounting.amount < 0}
										<p class=" text-red-500">{accounting.amount} €</p>
									{:else}
										<p class="text-green-500">+{accounting.amount} €</p>
									{/if}
								</td>
								<td class="p-1">
									{#if categories.find((c) => c.id === accounting.categoryId)}
										<p
											style="color: {categories.find((c) => c.id === accounting.categoryId)?.color}"
											class="font-semibold"
										>
											{categories.find((c) => c.id === accounting.categoryId)?.name}
										</p>
									{:else}
										<p class="text-gray-400">x</p>
									{/if}
								</td>
								<td class="flex justify-center p-1 items-center">
									<button
										on:click={() => {
											fetchContacts();
											const match = accounting.name.match(/^Payment\s(.+?)\s*:\s*(.+)$/);
											if (match) {
												AccountingpaymentToIndiv = true;
												AccountingNamecontactSelected = match[1].trim();
												AccountingName = match[2].trim();
											} else {
												AccountingName = accounting.name;
											}
											if (accounting.billDate) {
												AccountingBillDate = accounting.billDate;
											}
											if (accounting.paymentDate) {
												AccountingPaymentDate = accounting.paymentDate;
											}
											AccountingAmount = accounting.amount;
											AccountingCategory = accounting.categoryId;
											AccountingIsMusicianFee = accounting.isMusicianFee
											AccountingId = accounting.id;
											popUpAdd = true;
											updateMode = true;
										}}
									>
										<Fa icon={faPenToSquare} class="text-[16px]" style="color: #6B9AD9;" />
									</button>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
{/if}
