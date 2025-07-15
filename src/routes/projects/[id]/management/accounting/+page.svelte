<script lang="ts">
	import { onMount } from 'svelte';
	import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';
	import type { Project } from '$lib/types/Project';
	import ProjectPhoneDisplayer from '../ProjectPhoneDisplayer.svelte';
	import AccountingTable from '$lib/components/AccountingTable.svelte';
	import type { Accounting } from '$lib/types/Accounting';
	import PieChart from '$lib/components/PieChart.svelte';
	import type { ExpenseCategory } from '$lib/types/ExpenseCategory';
	import LineChart from '$lib/components/LineChart.svelte';

	export let data;

	let project: Project | undefined;

	let accountings: Accounting[];
	let categories: ExpenseCategory[];

	$: dataChartExpenses = (() => {
		if (!accountings || !categories) return null;

		// Filtrer les dépenses (amount < 0)
		const expenses = accountings.filter((a) => a.amount < 0);

		// Grouper par category_id
		const categorySums = new Map<number, number>();

		for (const exp of expenses) {
			const catId = exp.categoryId;
			const prev = categorySums.get(catId) ?? 0;
			categorySums.set(catId, prev + Math.abs(exp.amount)); // abs pour positiver
		}

		// Construire les labels et data
		const labels: string[] = [];
		const data: number[] = [];
		const backgroundColor: string[] = [];

		for (const [catId, sum] of categorySums.entries()) {
			const cat = categories.find((c) => c.id === catId);
			if (!cat) continue;
			labels.push(cat.name);
			data.push(sum);
			backgroundColor.push(cat.color ? cat.color : '#CCCCCC'); // couleur par catégorie
		}

		return {
			labels,
			datasets: [
				{
					label: 'Dépenses par catégorie',
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

		// Filtrer les dépenses (amount < 0)
		const incomes = accountings.filter((a) => a.amount >= 0);

		// Grouper par category_id
		const categorySums = new Map<number, number>();

		for (const inc of incomes) {
			const catId = inc.categoryId;
			const prev = categorySums.get(catId) ?? 0;
			categorySums.set(catId, prev + Math.abs(inc.amount)); // abs pour positiver
		}

		// Construire les labels et data
		const labels: string[] = [];
		const data: number[] = [];
		const backgroundColor: string[] = [];

		for (const [catId, sum] of categorySums.entries()) {
			const cat = categories.find((c) => c.id === catId);
			if (!cat) continue;
			labels.push(cat.name);
			data.push(sum);
			backgroundColor.push(cat.color ? cat.color : '#CCCCCC'); // couleur par catégorie
		}

		return {
			labels,
			datasets: [
				{
					label: 'Dépenses par catégorie',
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

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	onMount(async () => {
		await fetchProject();
		await fetchDataAccounting();
		await fetchCategories();
		console.log(accountings);
	});

	async function fetchProject() {
		if (!data?.id) return;

		const response = await fetch(`/api/projects/${data.id}`, {
			method: 'GET'
		});

		if (!response.ok) {
			return;
		}

		project = await response.json();
	}

	async function fetchDataAccounting() {
		if (!data?.id) return;

		const response = await fetch(`/api/projects/${data.id}/management/accounting`, {
			method: 'GET'
		});

		if (!response.ok) {
			return;
		}

		accountings = (await response.json()).sort((a, b) => a.id - b.id);
	}

	async function fetchCategories() {
		const res = await fetch('/api/expense_categories');

		if (!res.ok) {
			console.error('Erreur lors de la récupération des catégories');
			return;
		}

		categories = (await res.json()) as ExpenseCategory[];
		console.log(categories);
	}

	let isMobile = false;

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};

	let selectedTab = 1;
</script>

<ProjectHeadDisplayer {project} selectedTab={6} />

<div class="bg-[#E7E7E7] p-8 min-h-screen pb-[80px]">
	<div class="flex gap-8 mb-4 h-[50vh]">
		<div class="flex-[2] flex flex-col bg-gray-200">
			<div class="bg-gray-200 flex h-12">
				<button
					class="flex-1 uppercase font-bold text-sm
				{selectedTab === 1
						? 'border-t-2 border-r-2 border-l-2 rounded-t-xl border-gray-400 bg-white'
						: 'bg-gray-200 border-gray-300 rounded-l-xl rounded-t-xl border-t-2 border-l-2'}"
					on:click={() => (selectedTab = 1)}>Breakdown</button
				>
				<button
					class="flex-1 uppercase font-bold text-sm
				{selectedTab === 2
						? 'border-t-2 border-r-2 border-l-2 rounded-t-xl border-gray-400 bg-white'
						: 'bg-gray-200 border-gray-300 rounded-r-xl rounded-t-xl border-t-2 border-r-2'}"
					on:click={() => (selectedTab = 2)}>Balance</button
				>
			</div>
			{#if selectedTab === 1}
				<div class="flex rounded-b-xl w-full flex-1">
					<div
						class="flex-1 border-l-2 border-b-2 rounded-bl-xl border-gray-400 bg-white justify-center flex p-2 items-center
				{selectedTab === 1 ? 'border-l-2 border-gray-400' : 'border-t-2 rounded-t-xl'}"
					>
						<div class="w-[350px]">
							<h1 class="font-semibold  text-center text-sm mb-2 text-gray-400">Expenses</h1>
							<PieChart data={dataChartExpenses} {options} />
						</div>
					</div>
					<div
						class="flex-1 border-r-2 border-t-2 border-b-2 rounded-r-xl border-gray-400 bg-white flex justify-center p-2 items-center"
					>
						<div class="w-[350px]">
							<h1 class="font-semibold  text-center text-sm mb-2 text-gray-400">Incomes</h1>
							<PieChart data={dataChartIncome} {options} />
						</div>
					</div>
				</div>
			{/if}
			{#if selectedTab === 2}
				<div class="flex rounded-b-xl w-full flex-1 relative">
					<div class="absolute -top-3 bg-white right-[2px] text-white w-[49.7%] z-40">.</div>
					<div
						class="flex-1 border-r-2 border-t-2 border-b-2 rounded-l-xl rounded-br-xl border-gray-400 bg-white justify-center flex p-2
					{selectedTab === 2 ? 'border-l-2 border-gray-400' : 'border-t-2 rounded-t-xl'}"
					>
							<LineChart {accountings}></LineChart>
					</div>
				</div>
			{/if}
		</div>
		<div class="bg-white border-gray-400 border-2 rounded-xl p-4 flex-[1]">category</div>
	</div>
	<div class="bg-white border-gray-400 border-2 rounded-xl p-4">
		<AccountingTable bind:accountings bind:categories></AccountingTable>
	</div>
</div>

{#if isMobile}
	<ProjectPhoneDisplayer {project} selectedTab={6} />
{/if}
