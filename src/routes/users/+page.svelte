<script lang="ts">
	import { onMount } from 'svelte';

	let listUsers: any[] = [];

	const newUser = {
		email: '',
		password: '',
		password_confirmation: ''
	};

	onMount(async () => {
		const response = await fetch('/api/users', {
			method: 'GET'
		});

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
	});

	async function deleteUser(user: any) {
		const confirmDelete = confirm('Are you sure you want to delete this user ?');

		if (!confirmDelete) {
			return;
		}

		const response = await fetch(`/api/users/`, {
			method: 'DELETE',
			body: JSON.stringify({
				id: user.id
			})
		});

		errorEvent(response);

		if (response.status === 200) {
			listUsers = listUsers.filter((u) => u.id !== user.id);
		}
	}

	async function addUser() {
		const response = await fetch('/api/users', {
			method: 'PUT',
			body: JSON.stringify({
				email: newUser.email,
				password: newUser.password,
				password_confirmation: newUser.password_confirmation
			})
		});

		errorEvent(response);

		if (response.status === 200) {
			window.location.reload();
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

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 m-1">
	<!-- Add User Section -->
	<div class="flex flex-col border p-4 rounded-lg shadow-sm">
		<h1 class="text-2xl font-bold text-center w-full">Add User</h1>
		<form>
			<div class="flex flex-col mb-4">
				<label for="email">Email</label>
				<input
					type="email"
					class="border border-collapse rounded-md p-2"
					bind:value={newUser.email}
					required
				/>
			</div>
			<div class="flex flex-col mb-4">
				<label for="password">Password</label>
				<input
					type="password"
					class="border border-collapse rounded-md p-2"
					bind:value={newUser.password}
					required
				/>
			</div>
			<div class="flex flex-col mb-4">
				<label for="password_confirmation">Password Confirmation</label>
				<input
					type="password"
					class="border border-collapse rounded-md p-2"
					bind:value={newUser.password_confirmation}
					required
				/>
			</div>
			<div class="flex flex-col">
				<button
					type="submit"
					class="bg-blue-500 text-white px-4 py-2 rounded"
					on:click={() => addUser()}>Add</button
				>
			</div>
		</form>
	</div>

	<!-- User List Section -->
	<div class="flex flex-col border p-4 rounded-lg shadow-sm">
		<h1 class="text-2xl font-bold text-center w-full">Users</h1>
		<div>
			{#each listUsers as user}
				<div class="flex justify-between border border-collapse rounded-md mb-2 p-2">
					<div>
						<p>Email : {user.email}</p>
						<p>Created : {user.createdAt}</p>
						<p>Last activity : {user.token.lastUsedAt}</p>
					</div>
					<div>
						<button
							class="bg-red-500 text-white px-4 py-2 rounded"
							on:click={() => deleteUser(user)}>Delete</button>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
