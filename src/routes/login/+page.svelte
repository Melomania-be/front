<script lang="ts">
	import { goto } from '$app/navigation';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import { redirect } from '@sveltejs/kit';

	const responseHandlerClient = new ResponseHandlerClient();

	let email = '';
	let password = '';

	async function login() {
		if (email && password) {
			const response = await fetch('/api/sign_in', {
				method: 'POST',
				body: JSON.stringify({ email, password })
			});

			responseHandlerClient.handle(response, async () => {
				window.location.href = '/';
			});
		}
	}
</script>

<div class="container flex mx-auto items-center justify-center">
	<div
		class="text-center bg-gradient-to-r from-purple-500 to-indigo-600 p-8 rounded-md shadow-lg relative"
	>
		<div class="absolute inset-0 bg-white opacity-25 rounded-md pointer-events-none"></div>
		<!-- Effet de vitre -->
		<h1 class="text-4xl mb-8 text-white font-semibold relative z-10">Welcome Back!</h1>

		<div class="form relative z-10">
			<input
				class="input mb-4 p-3 w-full rounded-md bg-gray-200 placeholder-gray-500 text-grey-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
				title="Username"
				type="text"
				placeholder="Username"
				bind:value={email}
			/>
			<input
				class="input mb-4 p-3 w-full rounded-md bg-gray-200 placeholder-gray-500 text-grey-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
				title="Password"
				type="password"
				placeholder="Password"
				bind:value={password}
			/>
		</div>
		<button
			class="btn variant-filled bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 transition duration-300 relative z-10"
			on:click={login}>Login</button
		>
	</div>
</div>
