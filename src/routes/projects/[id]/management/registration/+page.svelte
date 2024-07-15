<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { Registration } from '$lib/types/Registration';
	import RegistrationModifier from '$lib/components/registration/RegistrationModifier.svelte';

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
				project: data.project ?? projectId,
				contents: data.content,
				form: data.form
			};

			console.log(registration);
		} else {
			const projectResponse = await fetch(`/api/projects/${projectId}`, {
				method: 'GET'
			});

			if (projectResponse.ok) {
				const project = await projectResponse.json();

				registration = {
					id: 0,
					project: project,
					contents: [],
					form: []
				};
			} else {
				alert('An error occured');
			}
		}
	});
</script>

<RegistrationModifier bind:registration {projectId} mode="modify" />
