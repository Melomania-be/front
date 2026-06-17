<script lang="ts">
	import { onMount } from 'svelte';

	let contractors = [];

	onMount(async () => {
		const response = await fetch('/api/contractor');

console.log('status', response.status);
console.log(await response.text());

		if (response.ok) {
			contractors = await response.json();
			console.log(contractors);
		}
	});
</script>

<h1>Contractor Contacts</h1>

{#each contractors as contractor}
	<div>
		{contractor.first_name}
		{contractor.last_name}
	</div>
{/each}