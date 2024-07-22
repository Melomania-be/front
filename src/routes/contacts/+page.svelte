<script lang="ts">
	import { onMount } from 'svelte';

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { CustomContact } from '$lib/types/CustomContact';
	import type { Contact } from '$lib/types/Contact';
	import Dashboard from './Dashboard.svelte';


	let metaContacts: any;
	let metaList: any;
	let metaValidationContact: any;
	let metaRecommendedContact: any;

	let options: any = {
		filter: '',
		limit: 1,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let urlContacts: string = '/api/contacts';
	let urlListe: string = '/api/lists';
	let urlValidationContact: string = '/api/contacts/validations';
	let urlRecommendedContact: string = '/api/recommended'
	

	let dashboardData = {
    	numberContact: 0,
    	numberListe: 0,
    	numberValidationContact: 0,
    	numberRecommendedContact: 0,
	}

	onMount(async () => {
		fetchData();
	});


	async function fetchData() {
		let optionInUrls = `?page=${options.page}&limit=${options.limit}`;
		optionInUrls += '&filter=' + options.filter;
		optionInUrls += '&orderBy=' + options.orderBy;
		optionInUrls += '&order=' + options.order;

		const responseContacts = await fetch(`${urlContacts}${optionInUrls}`, {
			method: 'GET'
		});

		const responseListe = await fetch(`${urlListe}${optionInUrls}`, {
			method: 'GET'
		});

		const responseValidationContact = await fetch(`${urlValidationContact}${optionInUrls}`, {
			method: 'GET'
		});

		const responseRecommendedContact = await fetch(`${urlRecommendedContact}${optionInUrls}`, {
			method: 'GET'
		});
		

		if (responseContacts.ok){
			const data = await responseContacts.json();

			metaContacts = data.meta;

			dashboardData.numberContact = metaContacts.total;
		};

		if (responseListe.ok){
			const data = await responseListe.json();

			metaList = data.meta;

			dashboardData.numberListe = metaList.total;
		};

		if (responseValidationContact.ok){
			const data = await responseValidationContact.json();

			metaValidationContact = data.meta;

			dashboardData.numberValidationContact = metaValidationContact.total;
		};

		if (responseRecommendedContact.ok){
			const data = await responseRecommendedContact.json();

			metaRecommendedContact = data.meta;

			dashboardData.numberRecommendedContact = metaRecommendedContact.total;

			console.log(metaRecommendedContact)
		};
	}
</script>


<div>
	<Dashboard data={dashboardData}></Dashboard>
</div>
