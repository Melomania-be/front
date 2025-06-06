<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { Registration } from '$lib/types/Registration';
	import RegistrationShow from '$lib/components/registration/RegistrationShow.svelte';
	import imageBackground from '$lib/assets/BackgrounImage.avif';
	
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
	<div class="fixed-background">
		<img src={imageBackground} alt="Background" />
		<div class="overlay-filter"></div>
	</div>
	<RegistrationShow bind:registration {projectId} />
{/if}


<style>
	.fixed-background {
		position: fixed;
		top: 0px;
		left: 0;
		width: 100vw;
		height: 35vh;
		overflow: hidden;
		z-index: -1;
	}
	.fixed-background img {
		top: 0px;
		width: 100%;
		height: 100%;
		object-fit: cover;
		overflow-x: hidden;
	}
	.overlay-filter {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 35vh;
		background: linear-gradient(
			to bottom,
			#6bb0c7db,
			/* couleur en haut */ #343cade1 /* couleur en bas */
		);
		display: flex;
		justify-content: center; /* centre horizontalement */
		align-items: center; /* centre verticalement */
		text-align: center; /* pour le texte */
		padding: 0 20px; /* optionnel : un peu de marge sur les côtés */
		pointer-events: none;
		overflow-x: hidden;
	}
</style>
