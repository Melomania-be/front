<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { Registration } from '$lib/types/Registration';
	import RegistrationShow from '$lib/components/registration/RegistrationShow.svelte';

	let registration: Registration;
	let projectId: number;

	onMount(async () => {
		projectId = parseInt($page.params.id);

		const registrationResponse = await fetch(`/api/registrations/${projectId}`, {
			method: 'GET'
		});

		if (registrationResponse.ok) {
			const data = await registrationResponse.json();

			console.log(data);

			registration = {
				id: data.id,
				project: data.project,
				contents: data.content,
				form: data.form
			};

			console.log(registration);
		} else {
			alert('No registration form found');
		}
	});
</script>

{#if registration}
	<RegistrationShow bind:registration {projectId} />
{/if}
