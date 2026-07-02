<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { Task } from '$lib/types/Task';
	import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';

	export let data;
	const projectId = data.id;

	let tasks: Task[] = [];
	let loading = true;
	let error = '';

	// New task form
	let showForm = false;
	let newTitle = '';
	let newDescription = '';
	let newStatus: 'todo' | 'in_progress' | 'done' = 'todo';
	let newAssignedTo: number | null = null;
	let users: any[] = [];

	let project: any = null;

	onMount(async () => {
		await fetchProject();
		await fetchTasks();
		await fetchUsers();
	});

	async function fetchProject() {
		try {
			const response = await fetch(`/api/projects/${projectId}/management`);
			if (response.ok) {
				const data = await response.json();
				project = data.data;
			}
		} catch (err) {
			console.error('Error fetching project:', err);
		}
	}

	async function fetchTasks() {
		loading = true;
		error = '';
		try {
			const response = await fetch(`/api/tasks?project_id=${projectId}`);
			if (response.ok) {
				tasks = await response.json();
			} else if (response.status === 401) {
				window.location.href = '/login';
			} else {
				error = 'Failed to load tasks.';
			}
		} catch (err) {
			error = 'Connection error.';
		} finally {
			loading = false;
		}
	}

	async function fetchUsers() {
		try {
			const response = await fetch(`/api/users`);
			if (response.ok) {
				const data = await response.json();
				users = data.data || data;
			}
		} catch (err) {
			console.error('Error fetching users:', err);
		}
	}

	async function createTask() {
		if (!newTitle.trim()) {
			alert('Title is required');
			return;
		}

		try {
			const response = await fetch(`/api/tasks`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: newTitle.trim(),
					description: newDescription.trim() || null,
					status: newStatus,
					projectId: Number(projectId),
					assignedTo: newAssignedTo
				})
			});

			if (response.ok) {
				newTitle = '';
				newDescription = '';
				newStatus = 'todo';
				newAssignedTo = null;
				showForm = false;
				await fetchTasks();
			} else if (response.status === 401) {
				window.location.href = '/login';
			} else {
				const err = await response.json();
				alert(err.message || 'Error creating task');
			}
		} catch (err) {
			alert('Connection error.');
		}
	}

	async function updateStatus(task: Task, newStatusValue: 'todo' | 'in_progress' | 'done') {
		try {
			const response = await fetch(`/api/tasks/${task.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatusValue })
			});

			if (response.ok) {
				task.status = newStatusValue;
				tasks = tasks;
			} else if (response.status === 401) {
				window.location.href = '/login';
			} else {
				alert('Error updating task');
			}
		} catch (err) {
			alert('Connection error.');
		}
	}

	async function deleteTask(task: Task) {
		const confirm = window.confirm(`Are you sure you want to delete "${task.title}"?`);
		if (!confirm) return;

		try {
			const response = await fetch(`/api/tasks/${task.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				tasks = tasks.filter(t => t.id !== task.id);
			} else if (response.status === 403) {
				alert('You are not allowed to delete this task. Only the creator can delete it.');
			} else if (response.status === 401) {
				window.location.href = '/login';
			} else {
				alert('Error deleting task');
			}
		} catch (err) {
			alert('Connection error.');
		}
	}

	function getStatusLabel(status: string) {
		switch (status) {
			case 'todo': return 'To Do';
			case 'in_progress': return 'In Progress';
			case 'done': return 'Done';
			default: return status;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'todo': return 'bg-gray-200 text-gray-700';
			case 'in_progress': return 'bg-blue-200 text-blue-700';
			case 'done': return 'bg-green-200 text-green-700';
			default: return 'bg-gray-200 text-gray-700';
		}
	}
</script>

{#if project}
	<ProjectHeadDisplayer {project} selectedTab={8} />
{/if}

<div class="p-4 bg-[#E7E7E7] min-h-screen">
	<div class="max-w-4xl mx-auto">
		<div class="flex items-center justify-between mb-6">
			<h1 class="text-2xl font-bold text-gray-700">Tasks</h1>
			<button
				class="bg-[#6B9AD9] hover:bg-[#5a89c8] text-white font-semibold px-4 py-2 rounded-lg"
				on:click={() => (showForm = !showForm)}
			>
				{showForm ? 'Cancel' : '+ Add Task'}
			</button>
		</div>

		<!-- Create task form -->
		{#if showForm}
			<div class="bg-white border-2 border-gray-300 rounded-xl p-4 mb-6">
				<h2 class="text-lg font-semibold mb-4 text-gray-600">New Task</h2>
				<div class="flex flex-col gap-3">
					<div>
						<label class="text-sm font-medium text-gray-600">Title *</label>
						<input
							class="w-full border-2 border-gray-300 rounded-lg p-2 mt-1 focus:outline-none focus:border-[#6B9AD9]"
							type="text"
							placeholder="Task title"
							bind:value={newTitle}
						/>
					</div>
					<div>
						<label class="text-sm font-medium text-gray-600">Description</label>
						<textarea
							class="w-full border-2 border-gray-300 rounded-lg p-2 mt-1 focus:outline-none focus:border-[#6B9AD9]"
							placeholder="Task description (optional)"
							rows="3"
							bind:value={newDescription}
						></textarea>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="text-sm font-medium text-gray-600">Status</label>
							<select
								class="w-full border-2 border-gray-300 rounded-lg p-2 mt-1 focus:outline-none"
								bind:value={newStatus}
							>
								<option value="todo">To Do</option>
								<option value="in_progress">In Progress</option>
								<option value="done">Done</option>
							</select>
						</div>
						<div>
							<label class="text-sm font-medium text-gray-600">Assign to</label>
							<select
								class="w-full border-2 border-gray-300 rounded-lg p-2 mt-1 focus:outline-none"
								bind:value={newAssignedTo}
							>
								<option value={null}>Unassigned</option>
								{#each users as user}
									<option value={user.id}>{user.firstName} {user.lastName}</option>
								{/each}
							</select>
						</div>
					</div>
					<div class="flex justify-end gap-2 mt-2">
						<button
							class="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-600 hover:bg-gray-100"
							on:click={() => (showForm = false)}
						>
							Cancel
						</button>
						<button
							class="px-4 py-2 rounded-lg bg-[#6B9AD9] hover:bg-[#5a89c8] text-white font-semibold"
							on:click={createTask}
						>
							Create Task
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Tasks list -->
		{#if loading}
			<div class="flex justify-center items-center h-32">
				<div class="w-8 h-8 border-4 border-[#6B9AD9] border-t-transparent rounded-full animate-spin"></div>
			</div>
		{:else if error}
			<div class="bg-red-100 border border-red-400 text-red-700 rounded-lg p-4">
				{error}
			</div>
		{:else if tasks.length === 0}
			<div class="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
				No tasks yet. Click "+ Add Task" to create one.
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each tasks as task}
					<div class="bg-white border-2 border-gray-200 rounded-xl p-4 flex items-start gap-4">
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<h3 class="font-semibold text-gray-800">{task.title}</h3>
								<span class="text-xs px-2 py-1 rounded-full font-medium {getStatusColor(task.status)}">
									{getStatusLabel(task.status)}
								</span>
							</div>
							{#if task.description}
								<p class="text-sm text-gray-500 mb-2">{task.description}</p>
							{/if}
							{#if task.assignedUser}
								<p class="text-xs text-gray-400">
									Assigned to: {task.assignedUser.firstName} {task.assignedUser.lastName}
								</p>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							<!-- Status update dropdown -->
							<select
								class="text-sm border border-gray-300 rounded-lg p-1"
								value={task.status}
								on:change={(e) => updateStatus(task, e.currentTarget.value as 'todo' | 'in_progress' | 'done')}
							>
								<option value="todo">To Do</option>
								<option value="in_progress">In Progress</option>
								<option value="done">Done</option>
							</select>
							<!-- Delete button -->
							<button
								class="text-red-400 hover:text-red-600 font-semibold text-sm px-2 py-1 rounded-lg border border-red-300 hover:bg-red-50"
								on:click={() => deleteTask(task)}
							>
								Delete
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div><script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { Task } from '$lib/types/Task';
	import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';

	export let data;
	const projectId = data.id;

	let tasks: Task[] = [];
	let loading = true;
	let error = '';

	// New task form
	let showForm = false;
	let newTitle = '';
	let newDescription = '';
	let newStatus: 'todo' | 'in_progress' | 'done' = 'todo';
	let newAssignedTo: number | null = null;
	let users: any[] = [];

	let project: any = null;

	onMount(async () => {
		await fetchProject();
		await fetchTasks();
		await fetchUsers();
	});

	async function fetchProject() {
		try {
			const response = await fetch(`/api/projects/${projectId}/management`);
			if (response.ok) {
				const data = await response.json();
				project = data.data;
			}
		} catch (err) {
			console.error('Error fetching project:', err);
		}
	}

	async function fetchTasks() {
		loading = true;
		error = '';
		try {
			const response = await fetch(`/api/tasks?project_id=${projectId}`);
			if (response.ok) {
				tasks = await response.json();
			} else if (response.status === 401) {
				window.location.href = '/login';
			} else {
				error = 'Failed to load tasks.';
			}
		} catch (err) {
			error = 'Connection error.';
		} finally {
			loading = false;
		}
	}

	async function fetchUsers() {
		try {
			const response = await fetch(`/api/users`);
			if (response.ok) {
				const data = await response.json();
				users = data.data || data;
			}
		} catch (err) {
			console.error('Error fetching users:', err);
		}
	}

	async function createTask() {
		if (!newTitle.trim()) {
			alert('Title is required');
			return;
		}

		try {
			const response = await fetch(`/api/tasks`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: newTitle.trim(),
					description: newDescription.trim() || null,
					status: newStatus,
					projectId: Number(projectId),
					assignedTo: newAssignedTo
				})
			});

			if (response.ok) {
				newTitle = '';
				newDescription = '';
				newStatus = 'todo';
				newAssignedTo = null;
				showForm = false;
				await fetchTasks();
			} else if (response.status === 401) {
				window.location.href = '/login';
			} else {
				const err = await response.json();
				alert(err.message || 'Error creating task');
			}
		} catch (err) {
			alert('Connection error.');
		}
	}

	async function updateStatus(task: Task, newStatusValue: 'todo' | 'in_progress' | 'done') {
		try {
			const response = await fetch(`/api/tasks/${task.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatusValue })
			});

			if (response.ok) {
				task.status = newStatusValue;
				tasks = tasks;
			} else if (response.status === 401) {
				window.location.href = '/login';
			} else {
				alert('Error updating task');
			}
		} catch (err) {
			alert('Connection error.');
		}
	}

	async function deleteTask(task: Task) {
		const confirm = window.confirm(`Are you sure you want to delete "${task.title}"?`);
		if (!confirm) return;

		try {
			const response = await fetch(`/api/tasks/${task.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				tasks = tasks.filter(t => t.id !== task.id);
			} else if (response.status === 403) {
				alert('You are not allowed to delete this task. Only the creator can delete it.');
			} else if (response.status === 401) {
				window.location.href = '/login';
			} else {
				alert('Error deleting task');
			}
		} catch (err) {
			alert('Connection error.');
		}
	}

	function getStatusLabel(status: string) {
		switch (status) {
			case 'todo': return 'To Do';
			case 'in_progress': return 'In Progress';
			case 'done': return 'Done';
			default: return status;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'todo': return 'bg-gray-200 text-gray-700';
			case 'in_progress': return 'bg-blue-200 text-blue-700';
			case 'done': return 'bg-green-200 text-green-700';
			default: return 'bg-gray-200 text-gray-700';
		}
	}
</script>

{#if project}
	<ProjectHeadDisplayer {project} selectedTab={8} />
{/if}

<div class="p-4 bg-[#E7E7E7] min-h-screen">
	<div class="max-w-4xl mx-auto">
		<div class="flex items-center justify-between mb-6">
			<h1 class="text-2xl font-bold text-gray-700">Tasks</h1>
			<button
				class="bg-[#6B9AD9] hover:bg-[#5a89c8] text-white font-semibold px-4 py-2 rounded-lg"
				on:click={() => (showForm = !showForm)}
			>
				{showForm ? 'Cancel' : '+ Add Task'}
			</button>
		</div>

		<!-- Create task form -->
		{#if showForm}
			<div class="bg-white border-2 border-gray-300 rounded-xl p-4 mb-6">
				<h2 class="text-lg font-semibold mb-4 text-gray-600">New Task</h2>
				<div class="flex flex-col gap-3">
					<div>
						<label class="text-sm font-medium text-gray-600">Title *</label>
						<input
							class="w-full border-2 border-gray-300 rounded-lg p-2 mt-1 focus:outline-none focus:border-[#6B9AD9]"
							type="text"
							placeholder="Task title"
							bind:value={newTitle}
						/>
					</div>
					<div>
						<label class="text-sm font-medium text-gray-600">Description</label>
						<textarea
							class="w-full border-2 border-gray-300 rounded-lg p-2 mt-1 focus:outline-none focus:border-[#6B9AD9]"
							placeholder="Task description (optional)"
							rows="3"
							bind:value={newDescription}
						></textarea>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="text-sm font-medium text-gray-600">Status</label>
							<select
								class="w-full border-2 border-gray-300 rounded-lg p-2 mt-1 focus:outline-none"
								bind:value={newStatus}
							>
								<option value="todo">To Do</option>
								<option value="in_progress">In Progress</option>
								<option value="done">Done</option>
							</select>
						</div>
						<div>
							<label class="text-sm font-medium text-gray-600">Assign to</label>
							<select
								class="w-full border-2 border-gray-300 rounded-lg p-2 mt-1 focus:outline-none"
								bind:value={newAssignedTo}
							>
								<option value={null}>Unassigned</option>
								{#each users as user}
									<option value={user.id}>{user.firstName} {user.lastName}</option>
								{/each}
							</select>
						</div>
					</div>
					<div class="flex justify-end gap-2 mt-2">
						<button
							class="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-600 hover:bg-gray-100"
							on:click={() => (showForm = false)}
						>
							Cancel
						</button>
						<button
							class="px-4 py-2 rounded-lg bg-[#6B9AD9] hover:bg-[#5a89c8] text-white font-semibold"
							on:click={createTask}
						>
							Create Task
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Tasks list -->
		{#if loading}
			<div class="flex justify-center items-center h-32">
				<div class="w-8 h-8 border-4 border-[#6B9AD9] border-t-transparent rounded-full animate-spin"></div>
			</div>
		{:else if error}
			<div class="bg-red-100 border border-red-400 text-red-700 rounded-lg p-4">
				{error}
			</div>
		{:else if tasks.length === 0}
			<div class="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
				No tasks yet. Click "+ Add Task" to create one.
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each tasks as task}
					<div class="bg-white border-2 border-gray-200 rounded-xl p-4 flex items-start gap-4">
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<h3 class="font-semibold text-gray-800">{task.title}</h3>
								<span class="text-xs px-2 py-1 rounded-full font-medium {getStatusColor(task.status)}">
									{getStatusLabel(task.status)}
								</span>
							</div>
							{#if task.description}
								<p class="text-sm text-gray-500 mb-2">{task.description}</p>
							{/if}
							{#if task.assignedUser}
								<p class="text-xs text-gray-400">
									Assigned to: {task.assignedUser.firstName} {task.assignedUser.lastName}
								</p>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							<!-- Status update dropdown -->
							<select
								class="text-sm border border-gray-300 rounded-lg p-1"
								value={task.status}
								on:change={(e) => updateStatus(task, e.currentTarget.value as 'todo' | 'in_progress' | 'done')}
							>
								<option value="todo">To Do</option>
								<option value="in_progress">In Progress</option>
								<option value="done">Done</option>
							</select>
							<!-- Delete button -->
							<button
								class="text-red-400 hover:text-red-600 font-semibold text-sm px-2 py-1 rounded-lg border border-red-300 hover:bg-red-50"
								on:click={() => deleteTask(task)}
							>
								Delete
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>