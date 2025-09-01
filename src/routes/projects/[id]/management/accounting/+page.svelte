<script lang="ts">
	import { onMount } from 'svelte';
	import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';
	import type { Project } from '$lib/types/Project';
	import ProjectPhoneDisplayer from '../ProjectPhoneDisplayer.svelte';
	import AccountingTable from '$lib/components/AccountingTable.svelte';
	import type { Accounting } from '$lib/types/Accounting';
	import PieChart from '$lib/components/PieChart.svelte';
	import type { ExpenseCategory } from '$lib/types/ExpenseCategory';
	import { Row } from 'svelte-materialify';
	import { Colors } from 'chart.js';
	import Fa from 'svelte-fa';
	import { faXmark } from '@fortawesome/free-solid-svg-icons';

	export let data;

	let project: Project | undefined;
	let accountings: Accounting[] = [];
	let categories: ExpenseCategory[] = [];

	$: dataChartExpenses = (() => {
		if (!accountings || !categories) return null;

		const expenses = accountings.filter((a) => a.amount < 0);
		const categorySums = new Map<number, number>();

		for (const exp of expenses) {
			const catId = exp.categoryId;
			const prev = categorySums.get(catId) ?? 0;
			categorySums.set(catId, prev + Math.abs(exp.amount));
		}

		const labels: string[] = [];
		const data: number[] = [];
		const backgroundColor: string[] = [];

		for (const [catId, sum] of categorySums.entries()) {
			const cat = categories.find((c) => c.id === catId);
			if (!cat) continue;
			labels.push(cat.name);
			data.push(sum);
			backgroundColor.push(cat.color ? cat.color : '#CCCCCC');
		}

		return {
			labels,
			datasets: [
				{
					label: 'Expenses by category',
					data,
					backgroundColor,
					borderColor: '#fff',
					borderWidth: 2
				}
			]
		};
	})();

	$: dataChartIncome = (() => {
		if (!accountings || !categories) return null;

		const incomes = accountings.filter((a) => a.amount >= 0);
		const categorySums = new Map<number, number>();

		for (const inc of incomes) {
			const catId = inc.categoryId;
			const prev = categorySums.get(catId) ?? 0;
			categorySums.set(catId, prev + Math.abs(inc.amount));
		}

		const labels: string[] = [];
		const data: number[] = [];
		const backgroundColor: string[] = [];

		for (const [catId, sum] of categorySums.entries()) {
			const cat = categories.find((c) => c.id === catId);
			if (!cat) continue;
			labels.push(cat.name);
			data.push(sum);
			backgroundColor.push(cat.color ? cat.color : '#CCCCCC');
		}

		return {
			labels,
			datasets: [
				{
					label: 'Income by category',
					data,
					backgroundColor,
					borderColor: '#fff',
					borderWidth: 2
				}
			]
		};
	})();

	const options = {
		responsive: true,
		plugins: {
			legend: {
				position: 'bottom'
			}
		}
	};

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

	onMount(async () => {
		await fetchProject();
		await fetchCategories();
		await fetchDataAccounting();
	});

	async function fetchProject() {
		if (!data?.id) return;

		try {
			const response = await fetch(`/api/projects/${data.id}`, {
				method: 'GET'
			});

			if (!response.ok) {
				console.error('Failed to fetch project');
				return;
			}

			project = await response.json();
		} catch (error) {
			console.error('Error fetching project:', error);
		}
	}

	async function fetchDataAccounting() {
		if (!data?.id) return;

		try {
			const response = await fetch(`/api/projects/${data.id}/management/accounting`, {
				method: 'GET'
			});

			if (!response.ok) {
				console.error('Failed to fetch accounting data:', response.status, response.statusText);
				const errorData = await response.text();
				console.error('Error response:', errorData);
				return;
			}

			const rawAccountings = await response.json();
			accountings = Array.isArray(rawAccountings) ? rawAccountings.sort((a, b) => a.id - b.id) : [];
		} catch (error) {
			console.error('Error fetching accounting data:', error);
			accountings = [];
		}
	}

	async function fetchCategories() {
		try {
			const res = await fetch('/api/expense_categories', {
				method: 'GET'
			});

			if (!res.ok) {
				console.error('Error fetching categories:', res.status);
				return;
			}

			categories = (await res.json()) as ExpenseCategory[];
		} catch (error) {
			console.error('Error fetching categories:', error);
			categories = [];
		}
	}

	let popUpAddCategory = false;

	function showPopUpAddCategory() {
		popUpAddCategory = true;
	}

	let categoryName: string | null = null;
	let categoryDescription: string | null = null;
	let categoryColor: string | null = '#9CA3AF';
	let categoryId: number | null = null;
	let categoryIsDefault: boolean = false;
	let updateMode = false;

	async function addCategory() {
		if (!categoryName) {
			alert('Please enter a category name');
			return;
		}

		let payload;

		if (updateMode && categoryId) {
			payload = {
				id: categoryId,
				name: categoryName,
				description: categoryDescription,
				color: categoryColor
			};
		} else {
			payload = {
				name: categoryName,
				description: categoryDescription,
				color: categoryColor
			};
		}

		try {
			const res = await fetch(`/api/expense_categories`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const errorResponse = await res.json();
				console.error('Error creating/updating category:', errorResponse);
				alert('Error: ' + (errorResponse.error || 'Unknown error'));
				return;
			}

			const newCategory: ExpenseCategory = await res.json();

			if (updateMode) {
				categories = categories
					.map((cat) => (cat.id === newCategory.id ? newCategory : cat))
					.sort((a, b) => a.id - b.id);
			} else {
				categories = [newCategory, ...categories].sort((a, b) => a.id - b.id);
			}

			resetInput();
		} catch (error) {
			console.error('Network error:', error);
			alert('Network error: ' + error.message);
		}
	}

	function resetInput() {
		categoryName = null;
		categoryDescription = null;
		categoryColor = '#9CA3AF';
		categoryIsDefault = false;
		categoryId = null;
		updateMode = false;
		popUpAddCategory = false;
	}

	async function deleteCategory() {
		if (!categoryId) {
			alert('No category selected for deletion');
			return;
		}

		try {
			const confirmed = confirm('Are you sure you want to delete this category?');
			if (!confirmed) return;

			const res = await fetch(`/api/expense_categories/${categoryId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!res.ok) {
				const errorResponse = await res.json();
				console.error('Error deleting category:', errorResponse);
				alert('Error: ' + (errorResponse.error || 'Unknown error'));
				return;
			}

			categories = categories.filter((cat) => cat.id !== categoryId);
			resetInput();
		} catch (error) {
			console.error('Network error:', error);
			alert('Network error: ' + error.message);
		}
	}
</script>

<ProjectHeadDisplayer {project} selectedTab={6} />

{#if popUpAddCategory}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div
			class="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center h-auto relative {isMobile
				? 'w-[90%]'
				: 'w-[40%]'}"
		>
			<button
				on:click={() => {
					resetInput();
				}}
				class="absolute top-2 right-3"
			>
				<Fa icon={faXmark} class="text-[20px]" style="color: #6b7280;" />
			</button>
			<h2 class="text-xl text-gray-500 font-bold mb-8">{updateMode ? 'Edit Category' : 'New Category'}</h2>
			<div class="h-full w-full">
				<div class="flex flex-col gap-4 items-center">
					<div class="flex flex-col {isMobile ? 'w-[70%]' : 'w-[50%]'}">
						<div
							class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
							style="width: fit-content;"
						>
							Name
						</div>
						<input
							type="text"
							class="p-2 px-3 border-2 border-gray-500 rounded-xl focus:outline-none"
							bind:value={categoryName}
							placeholder="Category Name"
							required
						/>
					</div>
					<div class="flex flex-col {isMobile ? 'w-[70%]' : 'w-[50%]'}">
						<div
							class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
							style="width: fit-content;"
						>
							Description
						</div>
						<input
							type="text"
							class="p-2 px-3 border-2 border-gray-500 rounded-xl focus:outline-none"
							bind:value={categoryDescription}
							placeholder="Description (optional)"
						/>
					</div>
					<div class="flex flex-col {isMobile ? 'w-[70%]' : 'w-[50%]'} mb-8">
						<label
							for="colorPicker"
							class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
							style="width: fit-content;"
						>
							Color
						</label>
						<input
							id="colorPicker"
							type="color"
							class="p-2 {isMobile
								? 'px-4'
								: 'px-20'} border-2 border-gray-500 rounded-xl focus:outline-none w-full h-10"
							bind:value={categoryColor}
							required
						/>
					</div>
				</div>
			</div>
			<div class="w-full gap-8 flex justify-center">
				{#if updateMode && categoryIsDefault}
					<button
						class="mt-4 w-[30%] px-4 py-2 bg-[#6b9ad9] text-white rounded font-semibold"
						on:click={() => {
							resetInput();
						}}>Cancel</button
					>
				{:else if updateMode && !categoryIsDefault}
					<button
						class="mt-4 w-[30%] px-4 py-2 bg-red-400 text-white rounded font-semibold"
						on:click={() => {
							deleteCategory();
						}}>Delete</button
					>
				{:else}
					<button
						class="mt-4 w-[30%] px-4 py-2 bg-[#6b9ad9] text-white rounded font-semibold"
						on:click={() => {
							resetInput();
						}}>Cancel</button
					>
				{/if}
				<button
					class="mt-4 w-[30%] px-4 py-2 bg-[#6b9ad9] text-white rounded font-semibold"
					on:click={() => {
						addCategory();
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

<div class="bg-[#E7E7E7] p-8 min-h-screen pb-[80px]">
	<div>
		<AccountingTable
			bind:accountings
			bind:categories
			currentParticipant={null}
			contact={null}
		/>
	</div>
	<div class="flex gap-8 mb-4 mt-4 {isMobile ? 'flex-col' : 'h-auto'}">
		<div class="flex-[2] flex flex-col border-2 rounded-xl bg-white border-gray-400">
			<div class="flex rounded-b-xl w-full flex-1 {isMobile ? 'flex-col' : ''}">
				<div class="flex-1 border-gray-400 justify-center flex p-2 items-center">
					<div class="{isMobile ? 'w-[250px]' : 'w-[350px]'}">
						<h1 class="font-semibold text-center text-sm mb-2 text-gray-400">Expenses</h1>
						{#if dataChartExpenses && dataChartExpenses.datasets[0].data.length > 0}
							<PieChart data={dataChartExpenses} {options} />
						{:else}
							<div class="text-center text-gray-500 p-4">No expenses data available</div>
						{/if}
					</div>
				</div>
				<div class="flex-1 border-gray-400 flex justify-center p-2 items-center">
					<div class="{isMobile ? 'w-[250px]' : 'w-[350px]'}">
						<h1 class="font-semibold text-center text-sm mb-2 text-gray-400">Incomes</h1>
						{#if dataChartIncome && dataChartIncome.datasets[0].data.length > 0}
							<PieChart data={dataChartIncome} {options} />
						{:else}
							<div class="text-center text-gray-500 p-4">No income data available</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
		<div class="bg-white border-gray-400 border-2 rounded-xl p-4 flex-[1]">
			<div class="flex">
				<h2 class="uppercase font-bold">categories</h2>
				<button
					on:click={() => showPopUpAddCategory()}
					class="bg-[#6B9AD9] px-4 mb-4 rounded-lg text-sm hover:bg-blue-700 text-white font-semibold ml-auto p-2"
				>Add New</button
				>
			</div>
			<div class="grid {isMobile ? 'grid-cols-2' : 'grid-cols-2'} gap-3 justify-center m-2 mt-4">
				{#if categories && categories.length > 0}
					{#each categories as cat}
						<div class="flex justify-center">
							<button
								on:click={() => {
									categoryName = cat.name;
									categoryId = cat.id;
									categoryDescription = cat.description;
									categoryColor = cat.color;
									categoryIsDefault = cat.isDefault;
									popUpAddCategory = true;
									updateMode = true;
								}}
								class="flex rounded-lg justify-center items-center text-center p-1 font-semibold break-words px-4 h-14 w-full"
								style="border: 2px solid {cat.color || '#9CA3AF'}; color: {cat.color ||
									'#9CA3AF'}"
							>
								{cat.name}
							</button>
						</div>
					{/each}
				{:else}
					<div class="col-span-2 text-center text-gray-500 p-4">No categories available</div>
				{/if}
			</div>
		</div>
	</div>
</div>

{#if isMobile}
	<ProjectPhoneDisplayer {project} selectedTab={6} />
{/if}