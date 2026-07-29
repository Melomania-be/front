<script lang="ts">
	import { onMount } from 'svelte';

	let organizations: any[] = []
	let isLoading = false
	let errorMessage = ''
	let successMessage = ''
	let showCreateForm = false

	const newOrg = {
		name: '',
		admin_email: '',
		admin_password: '',
		admin_full_name: ''
	}

	onMount(async () => {
		await loadOrganizations()
	})

	async function loadOrganizations() {
		try {
			const response = await fetch('/api/organization', { method: 'GET' })
			if (response.ok) {
				organizations = await response.json()
			} else {
				errorMessage = 'Failed to load organizations'
			}
		} catch (error) {
			errorMessage = 'Connection error'
		}
	}

	async function createOrganization() {
		if (!newOrg.name || !newOrg.admin_email || !newOrg.admin_password) {
			errorMessage = 'Organization name, admin email and password are required'
			return
		}

		isLoading = true
		errorMessage = ''
		successMessage = ''

		try {
			const response = await fetch('/api/organization', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newOrg)
			})

			if (response.ok) {
				successMessage = 'Organization created successfully!'
				newOrg.name = ''
				newOrg.admin_email = ''
				newOrg.admin_password = ''
				newOrg.admin_full_name = ''
				showCreateForm = false
				await loadOrganizations()
			} else {
				const data = await response.json()
				errorMessage = data.error || 'Failed to create organization'
			}
		} catch (error) {
			errorMessage = 'Connection error'
		} finally {
			isLoading = false
		}
	}
</script>

<div class="p-6">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-2xl font-bold">Organizations</h1>
		<button
			on:click={() => (showCreateForm = !showCreateForm)}
			class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
		>
			{showCreateForm ? 'Cancel' : 'New Organization'}
		</button>
	</div>

	{#if errorMessage}
		<div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
			{errorMessage}
		</div>
	{/if}

	{#if successMessage}
		<div class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
			{successMessage}
		</div>
	{/if}

	{#if showCreateForm}
		<div class="mb-6 p-4 border rounded-lg bg-gray-50">
			<h2 class="text-lg font-semibold mb-4">Create New Organization</h2>
			<div class="grid grid-cols-1 gap-4">
				<div>
					<label class="block text-sm font-medium mb-1">Organization Name *</label>
					<input
						type="text"
						bind:value={newOrg.name}
						placeholder="e.g. Orchestra of Paris"
						class="border rounded px-3 py-2 w-full"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Admin Full Name</label>
					<input
						type="text"
						bind:value={newOrg.admin_full_name}
						placeholder="Full Name"
						class="border rounded px-3 py-2 w-full"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Admin Email *</label>
					<input
						type="email"
						bind:value={newOrg.admin_email}
						placeholder="admin@orchestra.com"
						class="border rounded px-3 py-2 w-full"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium mb-1">Admin Password *</label>
					<input
						type="password"
						bind:value={newOrg.admin_password}
						placeholder="Secure password"
						class="border rounded px-3 py-2 w-full"
					/>
				</div>
				<button
					on:click={createOrganization}
					disabled={isLoading}
					class="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded w-full"
				>
					{isLoading ? 'Creating...' : 'Create Organization'}
				</button>
			</div>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-4">
		{#each organizations as org}
			<div class="p-4 border rounded-lg bg-white shadow-sm">
				<div class="flex justify-between items-center">
					<div>
						<h3 class="font-semibold text-lg">{org.name}</h3>
						<p class="text-sm text-gray-500">ID: {org.id}</p>
						<p class="text-sm text-gray-500">
						Created: {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}
						</p>
					</div>
				</div>
			</div>
		{:else}
			<p class="text-gray-500 text-center py-8">No organizations found.</p>
		{/each}
	</div>
</div>