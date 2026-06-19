<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';

	let listUsers: any[] = [];

	const newUser = {
		email: '',
		password: '',
		password_confirmation: '',
		fullName: ''
	};

	let editingUser: any = null;
	let editForm = {
		id: null,
		email: '',
		fullName: ''
	};

	onMount(async () => {
		await loadUsers();
	});

	async function loadUsers() {
		try {
			const response = await fetch('/api/users', {
				method: 'GET'
			});

			if (response.ok) {
				const data = await response.json();
				listUsers = data;

				listUsers = listUsers.map((user) => {
					return {
						...user,
						token: {
							...user.token,
							lastUsedAt: user.token
								? new Date(user.token.lastUsedAt).toLocaleString()
								: 'never connected'
						},
						createdAt: new Date(user.createdAt).toLocaleString()
					};
				});
			}
		} catch (error) {
			console.error('Error loading users:', error);
		}
	}

	async function deleteUser(user: any) {
		const confirmDelete = confirm('Are you sure you want to delete this user?');

		if (!confirmDelete) {
			return;
		}

		try {
			const response = await fetch(`/api/users/`, {
				method: 'DELETE',
				body: JSON.stringify({
					id: user.id
				})
			});

			await errorEvent(response);

			if (response.status === 200) {
				listUsers = listUsers.filter((u) => u.id !== user.id);
			}
		} catch (error) {
			console.error('Error deleting user:', error);
		}
	}

	async function addUser() {
		try {
			const response = await fetch('/api/users', {
				method: 'PUT',
				body: JSON.stringify({
					email: newUser.email,
					password: newUser.password,
					password_confirmation: newUser.password_confirmation,
					fullName: newUser.fullName
				})
			});

			await errorEvent(response);

			if (response.status === 200) {
				newUser.email = '';
				newUser.password = '';
				newUser.password_confirmation = '';
				newUser.fullName = '';

				await loadUsers();
			}
		} catch (error) {
			console.error('Error adding user:', error);
		}
	}

	async function editUser(user: any) {
		editingUser = user.id;
		editForm = {
			id: user.id,
			email: user.email,
			fullName: user.fullName || ''
		};
	}

	async function saveUser() {
		try {
			const response = await fetch('/api/users', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(editForm)
			});

			await errorEvent(response);

			if (response.status === 200) {
				editingUser = null;
				await loadUsers();
			}
		} catch (error) {
			console.error('Error editing user:', error);
		}
	}

	function cancelEdit() {
		editingUser = null;
		editForm = { id: null, email: '', fullName: '' };
	}

	async function errorEvent(response: Response) {
		if (response.status >= 400 && response.status < 500) {
			const jsonResponse = await response.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		} else if (response.status >= 500) {
			alert('Server error');
		}
	}
</script>

<div class="p-6 max-w-7xl mx-auto">
	<h1 class="text-3xl font-bold mb-8 text-center">User Management</h1>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6 self-start">
			<h2 class="text-2xl font-semibold mb-6 text-gray-800">Add a User</h2>

			<form on:submit|preventDefault={addUser} class="space-y-4">
				<div>
					<label for="fullName" class="block text-sm font-medium text-gray-700 mb-1">
						Full Name *
					</label>
					<input
						id="fullName"
						type="text"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
						bind:value={newUser.fullName}
						placeholder="User's full name"
						required
					/>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1"> Email * </label>
					<input
						id="email"
						type="email"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
						bind:value={newUser.email}
						placeholder="email@example.com"
						required
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
						Password *
					</label>
					<input
						id="password"
						type="password"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
						bind:value={newUser.password}
						placeholder="Password"
						required
					/>
				</div>

				<div>
					<label for="password_confirmation" class="block text-sm font-medium text-gray-700 mb-1">
						Confirm Password *
					</label>
					<input
						id="password_confirmation"
						type="password"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
						bind:value={newUser.password_confirmation}
						placeholder="Confirm password"
						required
					/>
				</div>

				<Button type="submit" variant="primary" className="w-full py-2.5 mt-2">
					Add user
				</Button>
			</form>
		</div>

		<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
			<h2 class="text-2xl font-semibold mb-6 text-gray-800">User List</h2>

			<div class="space-y-3">
				{#each listUsers as user (user.id)}
					<div class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow bg-gray-50/50">
						{#if editingUser === user.id}
							<div class="space-y-3">
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1"> Full Name </label>
									<input
										type="text"
										class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
										bind:value={editForm.fullName}
										placeholder="Full name"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1"> Email </label>
									<input
										type="email"
										class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
										bind:value={editForm.email}
									/>
								</div>
								<div class="flex gap-2 pt-2">
									<Button type="button" variant="primary" on:click={saveUser} className="px-4 py-1.5 text-xs">
										Save
									</Button>
									<Button type="button" variant="secondary" on:click={cancelEdit} className="px-4 py-1.5 text-xs">
										Cancel
									</Button>
								</div>
							</div>
						{:else}
							<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
								<div class="flex-1">
									{#if user.fullName}
										<p class="font-semibold text-gray-900">{user.fullName}</p>
										<p class="text-sm text-gray-600">{user.email}</p>
									{:else}
										<p class="font-semibold text-gray-900">{user.email}</p>
										<p class="text-sm text-gray-500 italic">No name defined</p>
									{/if}
									<div class="mt-2 space-y-0.5">
										<p class="text-xs text-gray-500 flex items-center gap-1">
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
											Created: {user.createdAt}
										</p>
										<p class="text-xs text-gray-500 flex items-center gap-1">
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
											Last activity: {user.token.lastUsedAt}
										</p>
									</div>
								</div>
								<div class="flex gap-2 w-full sm:w-auto">
									<Button type="button" variant="secondary" on:click={() => editUser(user)} className="px-3 py-1.5 text-xs flex-1 sm:flex-none">
										Edit
									</Button>
									<Button type="button" variant="danger" on:click={() => deleteUser(user)} className="px-3 py-1.5 text-xs flex-1 sm:flex-none">
										Delete
									</Button>
								</div>
							</div>
						{/if}
					</div>
				{/each}

				{#if listUsers.length === 0}
					<div class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
						<p>No users found</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>