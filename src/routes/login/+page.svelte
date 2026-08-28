<script lang="ts">
	import { goto } from '$app/navigation';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import { redirect } from '@sveltejs/kit';

	import { fade, fly, scale } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';

	// IMPORT DU NOUVEAU COMPOSANT (Vérifie le chemin si besoin)
	import Button from '$lib/components/Button.svelte';

	const responseHandlerClient = new ResponseHandlerClient();

	let email = '';
	let password = '';

	let loading = false;
	let submitted = false;
	let emailError = '';
	let passwordError = '';

	function validateEmail(email: string) {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return re.test(email);
	}

	async function handleSubmit() {
		// Reset errors
		emailError = '';
		passwordError = '';

		// Validate
		let isValid = true;

		if (!email) {
			emailError = 'Email is required';
			isValid = false;
		} else if (!validateEmail(email)) {
			emailError = 'Please enter a valid email';
			isValid = false;
		}

		if (!password) {
			passwordError = 'Password is required';
			isValid = false;
		} else if (password.length < 4) {
			passwordError = 'Password must be at least 6 characters';
			isValid = false;
		}

		if (isValid) {
			loading = true;

			// Simulate API call
			const response = await fetch('/api/sign_in', {
				method: 'POST',
				body: JSON.stringify({ email, password })
			});

			responseHandlerClient.handle(response, async () => {
				window.location.href = '/';
			});
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
	<div
		class="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden"
		in:fly={{ y: 20, duration: 700, delay: 300, easing: elasticOut }}
	>
		{#if !submitted}
			<div class="p-8" in:fade={{ duration: 300 }}>
				<div class="text-center mb-8" in:scale={{ duration: 400, delay: 500, easing: elasticOut }}>
					<h1 class="text-3xl font-bold text-gray-800">Welcome Back</h1>
					<p class="text-gray-600 mt-2">Sign in to your account</p>
				</div>

				<form on:submit|preventDefault={handleSubmit} class="space-y-6">
					<div class="space-y-2" in:fly={{ y: 10, duration: 400, delay: 600 }}>
						<label for="email" class="block text-sm font-medium text-gray-700">
							Email
						</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 outline-none"
							placeholder="you@example.com"
						/>
						{#if emailError}
							<p class="text-red-500 text-sm" in:fly={{ y: -10, duration: 200 }}>
								{emailError}
							</p>
						{/if}
					</div>

					<div class="space-y-2" in:fly={{ y: 10, duration: 400, delay: 700 }}>
						<label for="password" class="block text-sm font-medium text-gray-700">
							Password
						</label>
						<input
							id="password"
							type="password"
							bind:value={password}
							class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 outline-none"
							placeholder="••••••••"
						/>
						{#if passwordError}
							<p class="text-red-500 text-sm" in:fly={{ y: -10, duration: 200 }}>
								{passwordError}
							</p>
						{/if}
					</div>

					<div class="flex items-center justify-between" in:fly={{ y: 10, duration: 400, delay: 800 }}>
						<div class="flex items-center">
							<input
								id="remember-me"
								type="checkbox"
								class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
							/>
							<label for="remember-me" class="ml-2 block text-sm text-gray-700">
								Remember me
							</label>
						</div>

						<div class="text-sm">
							<a href="#" class="font-medium text-purple-600 hover:text-purple-500 transition-colors">
								Forgot password?
							</a>
						</div>
					</div>

					<div in:fly={{ y: 10, duration: 400, delay: 900 }}>
						<!-- CHANGEMENT : button -> Button -->
						<Button
							type="submit"
							class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
							disabled={loading}
						>
							{#if loading}
								<svg
									class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Signing in...
							{:else}
								Sign in
							{/if}
						</Button>
					</div>
				</form>
			</div>
		{:else}
			<div
				class="p-8 text-center"
				in:scale={{ duration: 400, easing: elasticOut }}
			>
				<div class="rounded-full bg-green-100 p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
					<svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
					</svg>
				</div>
				<h2 class="text-2xl font-bold text-gray-800 mb-2">Login Successful!</h2>
				<p class="text-gray-600">You are now being redirected to your dashboard...</p>
			</div>
		{/if}
	</div>
</div>

<style>
    /* Add custom styles for input focus animation */
    input:focus {
        transform: translateY(-2px);
    }

    /* Smooth transition for all interactive elements */
    a, :global(button), input {
        transition: all 0.2s ease;
    }
</style>