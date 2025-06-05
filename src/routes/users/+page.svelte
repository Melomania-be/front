<script lang="ts">
import { onMount } from 'svelte';
import toast from 'svelte-french-toast';
import { confirmDialog } from '$lib/utils/confirmDialog';
	let listUsers: any[] = [];
	let showModal = false;
	const newUser = {
		fullName: '',
		email: '',
		password: '',
		password_confirmation: ''
	};

	onMount(async () => {

		const response = await fetch('/api/users', {
			method: 'GET'
		});

		const data = await response.json();
		console.log('data', data);

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

	// async function deleteUser(user: any) {
	// 	const confirmDelete = confirm('Are you sure you want to delete this user ?');

	// 	if (!confirmDelete) {
	// 		return;
	// 	}

	// 	const response = await fetch(`/api/users/`, {
	// 		method: 'DELETE',
	// 		body: JSON.stringify({
	// 			id: user.id
	// 		})
	// 	});

	// 	errorEvent(response);

	// 	if (response.status === 200) {
	// 		listUsers = listUsers.filter((u) => u.id !== user.id);
	// 	}
	// }

	async function deleteUser(user: any) {
  const confirmDelete = await confirmDialog('Are you sure you want to delete this user?');

  if (!confirmDelete) return;

  const response = await fetch(`/api/users/`, {
    method: 'DELETE',
    body: JSON.stringify({ id: user.id })
  });

  errorEvent(response);

  if (response.status === 200) {
	
  toast.success('User deleted successfully');
	

    listUsers = listUsers.filter((u) => u.id !== user.id);
  }
}

	async function addUser() {
		const response = await fetch('/api/users', {
			method: 'PUT',
			body: JSON.stringify({
				full_name: newUser.fullName,
				email: newUser.email,
				password: newUser.password,
				password_confirmation: newUser.password_confirmation
			})
		});

		errorEvent(response);

		if (response.status === 200) {
			toast.success('User added successfully');
			showModal = false; // Close modal
		newUser.fullName = '';
		newUser.email = '';
		newUser.password = '';
		newUser.password_confirmation = '';
			window.location.reload();
		}
	}

	async function errorEvent(response: Response) {
		if (response.status >= 400 && response.status < 500) {
			const jsonResponse = await response.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			// alert(error);
			toast.error(error || 'Something went wrong');
		} else if (response.status >= 500) {
			// alert('Server error');
			toast.error('Server error');
		}
	}
</script>

<div>
<!-- <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 m-1"> -->
	<!-- Add User Section -->
	<!-- <div class="flex flex-col border p-4 rounded-lg shadow-sm">
		<h1 class="text-2xl font-bold text-center w-full">Add User</h1>
		<form on:submit|preventDefault={addUser}>
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
	</div> -->
<div class="mb-4">
  <button
    class="bg-blue-500 text-white px-4 py-2 rounded"
    on:click={() => showModal = true}
  >
    Add User
  </button>
</div>
	<!-- User List Section -->
	<div class="flex flex-col border p-4 rounded-lg shadow-sm">
		<h1 class="text-2xl font-bold text-center w-full">Users</h1>
		<div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
			{#each listUsers as user}
				<div class=" border border-collapse rounded-md mb-2 p-2">
					<div>
						<p>Name : {user.fullName}</p>
						<p>Email : {user.email}</p>
						<p>Created : {user.createdAt}</p>
						<p>Last activity : {user.token.lastUsedAt}</p>
					</div>
					<div>
						<button
							class="bg-red-500 text-white px-4 py-2 rounded !w-full"
							on:click={() => deleteUser(user)}>Delete</button>
					</div>
				</div>
			{/each}		
		</div>
	</div>



	<!-- add user modal -->
	 {#if showModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg relative">
      <!-- Close Button -->
      <button
        class="absolute top-2 right-2 text-gray-500 hover:text-red-600"
        on:click={() => showModal = false}
      >
        ✕
      </button>

      <h2 class="text-xl font-bold mb-4">Add New User</h2>

      <form on:submit|preventDefault={addUser} class="space-y-4">
		<div>
		  <label>Name</label>
		  <input
			type="text"
			class="w-full border rounded p-2"
			bind:value={newUser.fullName}
			required
		  />
		</div>

        <div>
          <label>Email</label>
          <input
            type="email"
            class="w-full border rounded p-2"
            bind:value={newUser.email}
            required
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            class="w-full border rounded p-2"
            bind:value={newUser.password}
            required
          />
        </div>

        <div>
          <label>Password Confirmation</label>
          <input
            type="password"
            class="w-full border rounded p-2"
            bind:value={newUser.password_confirmation}
            required
          />
        </div>

        <div class="flex justify-end space-x-2">
          <button
            type="button"
            class="px-4 py-2 bg-gray-300 rounded"
            on:click={() => showModal = false}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

</div>
