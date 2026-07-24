<script lang="ts">
	import { onMount } from 'svelte';

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

	// ── Privileges ────────────────────────────────────────────────

	async function updatePrivileges(userId: number, updates: {
		role?: string;
		canAccessContacts?: boolean;
		canExportContacts?: boolean;
		isActive?: boolean;
	}) {
		try {
			const response = await fetch(`/api/users/${userId}/privileges`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates)
			});
			if (response.ok) {
				await loadUsers();
			} else {
				const err = await response.json();
				alert(err.error || 'Erreur lors de la mise à jour des privilèges');
			}
		} catch (error) {
			console.error('Error updating privileges:', error);
		}
	}

	// Handlers séparés pour éviter les cast TypeScript dans le template
	function handleRoleChange(userId: number, event: Event) {
		const value = (event.target as HTMLSelectElement).value;
		updatePrivileges(userId, { role: value });
	}

	function handleContactsChange(userId: number, event: Event) {
		const checked = (event.target as HTMLInputElement).checked;
		updatePrivileges(userId, { canAccessContacts: checked });
	}

	function handleExportChange(userId: number, event: Event) {
		const checked = (event.target as HTMLInputElement).checked;
		updatePrivileges(userId, { canExportContacts: checked });
	}

	function handleActiveChange(userId: number, event: Event) {
		const checked = (event.target as HTMLInputElement).checked;
		updatePrivileges(userId, { isActive: checked });
	}

	async function assignProjects(userId: number, projectIds: number[]) {
		try {
			const response = await fetch(`/api/users/${userId}/projects`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ projectIds })
			});
			if (response.ok) {
				alert('Projets assignés avec succès');
			} else {
				const err = await response.json();
				alert(err.error || "Erreur lors de l'assignation des projets");
			}
		} catch (error) {
			console.error('Error assigning projects:', error);
		}
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
		<!-- Add a User section -->
		<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
			<h2 class="text-2xl font-semibold mb-6 text-gray-800">Add a User</h2>

			<form on:submit|preventDefault={addUser} class="space-y-4">
				<div>
					<label for="fullName" class="block text-sm font-medium text-gray-700 mb-1">
						Full Name *
					</label>
					<input
						id="fullName"
						type="text"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						bind:value={newUser.fullName}
						placeholder="User's full name"
						required
					/>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
						Email *
					</label>
					<input
						id="email"
						type="email"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						bind:value={newUser.password_confirmation}
						placeholder="Confirm password"
						required
					/>
				</div>

				<button
					type="submit"
					class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
				>
					Add user
				</button>
			</form>
		</div>

		<!-- User List section -->
		<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
			<h2 class="text-2xl font-semibold mb-6 text-gray-800">User List</h2>

			<div class="space-y-3">
				{#each listUsers as user (user.id)}
					<div class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
						{#if editingUser === user.id}
							<!-- Edit mode -->
							<div class="space-y-3">
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
									<input
										type="text"
										class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										bind:value={editForm.fullName}
										placeholder="Full name"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
									<input
										type="email"
										class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										bind:value={editForm.email}
									/>
								</div>
								<div class="flex gap-2">
									<button
										type="button"
										on:click={saveUser}
										class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
									>
										Save
									</button>
									<button
										type="button"
										on:click={cancelEdit}
										class="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
									>
										Cancel
									</button>
								</div>
							</div>
						{:else}
							<!-- Display mode -->
							<div class="flex justify-between items-start">
								<div class="flex-1">
									{#if user.fullName}
										<p class="font-semibold text-gray-900">{user.fullName}</p>
										<p class="text-sm text-gray-600">{user.email}</p>
									{:else}
										<p class="font-semibold text-gray-900">{user.email}</p>
										<p class="text-sm text-gray-500 italic">No name defined</p>
									{/if}
									<p class="text-xs text-gray-500 mt-1">Created: {user.createdAt}</p>
									<p class="text-xs text-gray-500">Last activity: {user.token.lastUsedAt}</p>

									<!-- Rôle & permissions -->
									<div class="mt-2 flex flex-wrap gap-3 items-center">
										<select
											class="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
											value={user.role || 'user'}
											on:change={(e) => handleRoleChange(user.id, e)}
										>
											<option value="superadmin">Superadmin</option>
											<option value="user">Utilisateur</option>
											<option value="guest">Invité</option>
										</select>

										<label class="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
											<input
												type="checkbox"
												checked={user.canAccessContacts}
												on:change={(e) => handleContactsChange(user.id, e)}
											/>
											Contacts
										</label>

										<label class="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
											<input
												type="checkbox"
												checked={user.canExportContacts}
												on:change={(e) => handleExportChange(user.id, e)}
											/>
											Export
										</label>

										<label class="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
											<input
												type="checkbox"
												checked={user.isActive}
												on:change={(e) => handleActiveChange(user.id, e)}
											/>
											Actif
										</label>
									</div>
								</div>

								<div class="flex gap-2 ml-4">
									<button
										type="button"
										on:click={() => editUser(user)}
										class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
									>
										Edit
									</button>
									<button
										type="button"
										on:click={() => deleteUser(user)}
										class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
									>
										Delete
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/each}

				{#if listUsers.length === 0}
					<div class="text-center py-8 text-gray-500">
						<p>No users found</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>