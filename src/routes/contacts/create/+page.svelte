<script lang="ts">
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import ContactModifier from '$lib/components/contact/ContactModifier.svelte';
	import type { Contact } from '$lib/types/Contact';
	import type { Instrument } from '$lib/types/Instrument';
	import { onMount } from 'svelte';

	let listInstruments: Array<Instrument>;
	const contact: Contact = {
		id: null,
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		messenger: '',
		comments: '',
		instruments: [],
		participant: [],
		recommendation_pending: false,
		validated: false,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	onMount(async () => {
		let response = await fetch('/api/instruments', {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			listInstruments = await response.json();
		});
	});
</script>

<ContactModifier mode="create" {contact} instruments={listInstruments} />
