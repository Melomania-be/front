<!-- src/routes/users/+page.svelte - Version mise à jour avec full_name -->
<script lang="ts">
	import { onMount } from 'svelte';

	let listUsers: any[] = [];

	const newUser = {
		email: '',
		password: '',
		password_confirmation: '',
		fullName: '' // 🆕 Ajout du champ fullName
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
			console.error('Erreur lors du chargement des utilisateurs:', error);
		}
	}

	async function deleteUser(user: any) {
		const confirmDelete = confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?');

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
			console.error('Erreur lors de la suppression:', error);
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
					fullName: newUser.fullName // 🆕 Inclure fullName
				})
			});

			await errorEvent(response);

			if (response.status === 200) {
				// Réinitialiser le formulaire
				newUser.email = '';
				newUser.password = '';
				newUser.password_confirmation = '';
				newUser.fullName = '';

				// Recharger la liste
				await loadUsers();
			}
		} catch (error) {
			console.error('Erreur lors de l\'ajout:', error);
		}
	}

	// 🆕 Fonction pour éditer un utilisateur
	async function editUser(user: any) {
		editingUser = user.id;
		editForm = {
			id: user.id,
			email: user.email,
			fullName: user.fullName || ''
		};
	}

	// 🆕 Fonction pour sauvegarder les modifications
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
			console.error('Erreur lors de la modification:', error);
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
			alert('Erreur serveur');
		}
	}
</script>

<div class="p-6 max-w-7xl mx-auto">
	<h1 class="text-3xl font-bold mb-8 text-center">Gestion des Utilisateurs</h1>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Section Ajouter un Utilisateur -->
		<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
			<h2 class="text-2xl font-semibold mb-6 text-gray-800">Ajouter un Utilisateur</h2>

			<form on:submit|preventDefault={addUser} class="space-y-4">
				<!-- 🆕 Champ Nom complet -->
				<div>
					<label for="fullName" class="block text-sm font-medium text-gray-700 mb-1">
						Nom complet *
					</label>
					<input
						id="fullName"
						type="text"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						bind:value={newUser.fullName}
						placeholder="Nom et prénom de l'utilisateur"
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
						placeholder="email@exemple.com"
						required
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
						Mot de passe *
					</label>
					<input
						id="password"
						type="password"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						bind:value={newUser.password}
						placeholder="Mot de passe"
						required
					/>
				</div>

				<div>
					<label for="password_confirmation" class="block text-sm font-medium text-gray-700 mb-1">
						Confirmation mot de passe *
					</label>
					<input
						id="password_confirmation"
						type="password"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						bind:value={newUser.password_confirmation}
						placeholder="Confirmer le mot de passe"
						required
					/>
				</div>

				<button
					type="submit"
					class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
				>
					Ajouter l'utilisateur
				</button>
			</form>
		</div>

		<!-- Section Liste des Utilisateurs -->
		<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
			<h2 class="text-2xl font-semibold mb-6 text-gray-800">Liste des Utilisateurs</h2>

			<div class="space-y-3">
				{#each listUsers as user (user.id)}
					<div class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
						{#if editingUser === user.id}
							<!-- Mode édition -->
							<div class="space-y-3">
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">
										Nom complet
									</label>
									<input
										type="text"
										class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										bind:value={editForm.fullName}
										placeholder="Nom complet"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">
										Email
									</label>
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
										Sauvegarder
									</button>
									<button
										type="button"
										on:click={cancelEdit}
										class="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
									>
										Annuler
									</button>
								</div>
							</div>
						{:else}
							<!-- Mode affichage -->
							<div class="flex justify-between items-start">
								<div class="flex-1">
									<!-- 🆕 Affichage du nom complet -->
									{#if user.fullName}
										<p class="font-semibold text-gray-900">{user.fullName}</p>
										<p class="text-sm text-gray-600">{user.email}</p>
									{:else}
										<p class="font-semibold text-gray-900">{user.email}</p>
										<p class="text-sm text-gray-500 italic">Nom non défini</p>
									{/if}
									<p class="text-xs text-gray-500 mt-1">Créé : {user.createdAt}</p>
									<p class="text-xs text-gray-500">Dernière activité : {user.token.lastUsedAt}</p>
								</div>
								<div class="flex gap-2">
									<button
										type="button"
										on:click={() => editUser(user)}
										class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
									>
										Modifier
									</button>
									<button
										type="button"
										on:click={() => deleteUser(user)}
										class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
									>
										Supprimer
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/each}

				{#if listUsers.length === 0}
					<div class="text-center py-8 text-gray-500">
						<p>Aucun utilisateur trouvé</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>