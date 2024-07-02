<script lang="ts">
	import type { Instrument } from '$lib/types/Instrument.js';
	import type { Contact } from '$lib/types/Contact.js';
	import DateShow from '$lib/components/DateShow.svelte';
	import ContactModifier from '$lib/components/contact/ContactModifier.svelte';

	export let data;

	let contact: Contact = structuredClone(data.contact);
	let instruments: Array<Instrument> = structuredClone(data.instruments);
</script>

<ContactModifier mode="modify" {contact} {instruments} />
<div
	class="w-full bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
>
	<div class="p-5">
		<h3 class="w-full text-center m-1">Participated in the following projets :</h3>
	</div>

	<div class="grid grid-cols-2 w-full">
		{#each contact.participants as participant}
			<div
				class="group text-sm *:break-words block mr-1 mt-1 p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 hover:max-h-full *:[&:not(:hover)]:truncate"
			>
				<h6 class="mb-2 font-bold tracking-tight text-gray-900 dark:text-white">
					{participant.project.name}
				</h6>
				<p class="text-gray-700 dark:text-gray-300">In section : {participant.section.name}</p>
				<p class="text-gray-700 dark:text-gray-300">
					Last activity seen : <DateShow bind:date={participant.lastActivity} />
				</p>
			</div>
		{/each}
	</div>
</div>
