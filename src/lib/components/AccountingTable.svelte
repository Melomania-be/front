<script lang="ts">
	import type { Accounting } from '$lib/types/Accounting';
	import Fa from 'svelte-fa';
	import DateShow from './DateShow.svelte';
	import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
	import type { ExpenseCategory } from '$lib/types/ExpenseCategory';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';

	export let accountings: Accounting[];

	export let categories: ExpenseCategory[];

	const projectId = get(page).params.id;

	let popUpAdd = false;
	let updateMode = false;

	function showPopUpAdd() {
		popUpAdd = true;
	}

	let AccountingName: string | null = null;
	let AccountingBillDate: string = '';
	let AccountingPaymentDate: string = '';
	let AccountingCategory: number | null = null;
	let AccountingAmount: number | null = null;
	let AccountingId: number | null = null;

	async function addAccounting() {
		if (!AccountingAmount || !AccountingName) {
			console.log('blblblbl');
			return;
		}

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

		if (updateMode) {
			payload = {
				id: AccountingId,
				name: AccountingName,
				bill_date: billDateISO,
				payment_date: paymentDateISO,
				amount: AccountingAmount,
				category_id: +AccountingCategory,
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
			} else {
				accountings = [newAccounting, ...accountings].sort((a, b) => a.id - b.id); // tri ici aussi
			}

			// Reset
			AccountingName = '';
			AccountingBillDate = '';
			AccountingPaymentDate = '';
			AccountingAmount = null;
			AccountingCategory = null;
			popUpAdd = false;
			updateMode = false;
		} catch (error) {
			console.error('Erreur réseau :', error);
		}
	}
</script>

{#if popUpAdd}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div class="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center w-[50%] h-auto">
			<h2 class="text-xl text-gray-500 font-bold mb-8">New</h2>
			<div class="h-full w-full">
				<div class="flex flex-col gap-2 items-center">
					<!--NAME-->
					<div class="flex flex-col w-[50%]">
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
					<div class="flex flex-col w-[50%]">
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
					<div class="flex flex-col w-[50%]">
						<div
							class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
							style="width: fit-content;"
						>
							Payment Date
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
					<div class="flex flex-col w-[50%] relative">
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
					<div class="flex flex-col w-[50%] relative mb-8">
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
				</div>
			</div>
			<div class="w-full gap-8 flex justify-center">
				<button
					class="mt-4 w-[30%] px-4 py-2 bg-[#6b9ad9] text-white rounded font-semibold"
					on:click={() => {
						popUpAdd = false;
						updateMode = false;
					}}>Cancel</button
				>
				<button
					class="mt-4 w-[30%] px-4 py-2 bg-[#6b9ad9] text-white rounded font-semibold"
					on:click={() => {
						popUpAdd = false;
						addAccounting();
					}}>
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
	<button
		on:click={() => showPopUpAdd()}
		class="bg-[#6B9AD9] px-4 mb-4 rounded-lg text-sm hover:bg-blue-700 text-white font-semibold ml-auto p-2"
		>Add New</button
	>
	<div class="overflow-x-auto">
		<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
			<thead
				class="text-xs text-gray-700 uppercase border-b-2 border-gray-300 text-center dark:bg-gray-700 dark:text-gray-400 h-8"
			>
				<tr class="font-semibold text-md">
					<th class="text-left">Name</th>
					<th>Bill Date</th>
					<th>Payment Date</th>
					<th>Amount</th>
					<th>Category</th>
					<th>Action</th>
				</tr>
			</thead>
			<tbody>
				{#if accountings}
					{#each accountings as accounting}
						<tr class="font-semibold text-gray-400">
							<td>{accounting.name}</td>
							<td class="text-center p-1">{accounting.billDate ? accounting.billDate : 'unknown'}</td>
							<td class="text-center p-1">{accounting.paymentDate ? accounting.paymentDate : 'unpaid'}</td>
							<td class="text-center p-1">
								{#if accounting.amount < 0}
									<p class=" text-red-500">{accounting.amount} €</p>
								{:else}
									<p class="text-green-500">+{accounting.amount} €</p>
								{/if}
							</td>
							<td class="text-center p-1">
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
										AccountingName = accounting.name;
										if (accounting.billDate) {
											AccountingBillDate = accounting.billDate;
										}
										if (accounting.paymentDate) {
											AccountingPaymentDate = accounting.paymentDate;
										}
										AccountingAmount = accounting.amount;
										AccountingCategory = accounting.categoryId;
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