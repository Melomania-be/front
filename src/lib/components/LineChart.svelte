<script lang="ts">
	import { onMount } from 'svelte';

	import type { Accounting } from '$lib/types/Accounting';
	import { faEbay } from '@fortawesome/free-brands-svg-icons';

	export let accountings: Accounting[] = [];

	let paid: number = 0;
	let toPaid: number = 0;
	let income: number = 0;

	$: if (accountings.length !== 0) {
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
</script>

{#if accountings}
	<div class="h-auto w-full items-center flex gap-4 text-gray-600 font-bold">
		<div class="border-2 w-full rounded-xl border-gray-400 p-2">
			Paid : <span class="text-blue-500">{-paid} €</span>
		</div>
		<div class="border-2 w-full rounded-xl border-gray-400 p-2">
			To Paid : <span class="text-red-500"> {-toPaid} € </span>
		</div>
		<div class="border-2 w-full rounded-xl border-gray-400 p-2">
			Income : <span class="text-green-500">{income} €</span>
		</div>
	</div>
{:else}
	<p class="text-gray-500 text-sm">No data available.</p>
{/if}
