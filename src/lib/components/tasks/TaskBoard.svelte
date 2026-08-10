<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { flip } from 'svelte/animate'
	import { fade } from 'svelte/transition'
	import { tasksStore } from '$lib/stores/tasks.store'
	import TaskCard from './TaskCard.svelte'
	import TaskModal from './TaskModal.svelte'
	import { Toaster } from 'svelte-french-toast'
	import type { Task } from '$lib/services/tasks.service'

	export let projectId: number | undefined = undefined
	export let eventId: number | undefined = undefined
	export let sectionId: number | undefined = undefined

	let participants: any[] = []

	// UI States
	let isModalOpen = false
	let editingTask: any = null
	let isDragging = false
	let refreshInterval: ReturnType<typeof setInterval>

	// Filtres
	let searchQuery = ''
	let activeFilter: 'all' | 'urgent' | 'overdue' = 'all'
	let filterAssignee: number | 'all' = 'all'

	onMount(async () => {
		await loadData()


		refreshInterval = setInterval(() => {

			if (!isModalOpen && !isDragging) {
				tasksStore.loadTasks({ projectId, eventId, sectionId })
			}
		}, 5000)
	})

	onDestroy(() => {
		// On nettoie l'intervalle quand on quitte la page
		if (refreshInterval) clearInterval(refreshInterval)
	})

	async function loadData() {
		await tasksStore.loadTasks({ projectId, eventId, sectionId })
		if (projectId) {
			try {
				const response = await fetch(`/api/projects/${projectId}`)
				if (response.ok) {
					const projectData = await response.json()
					participants = projectData.participants || []
				}
			} catch (e) { console.error(e) }
		}
	}

	// LOGIQUE DE FILTRAGE AVANCÉE
	$: filteredTasks = $tasksStore.filter(task => {
		// 1. Filtre par recherche textuelle
		if (searchQuery) {
			const search = searchQuery.toLowerCase();
			const matchTitle = task.title.toLowerCase().includes(search);
			const matchDesc = task.description?.toLowerCase().includes(search);
			if (!matchTitle && !matchDesc) return false;
		}

		// 2. Filtre par Assigné (NOUVEAU)
		if (filterAssignee !== 'all' && task.assigneeId !== filterAssignee) return false;

		// 3. Filtres rapides (Boutons)
		if (activeFilter === 'urgent' && task.priority !== 'high') return false;
		if (activeFilter === 'overdue') {
			const isOverdue = task.dueDate && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));
			if (!isOverdue || task.status === 'done') return false;
		}

		return true;
	});

	$: todoTasks = filteredTasks.filter(t => t.status === 'todo')
	$: inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress')
	$: doneTasks = filteredTasks.filter(t => t.status === 'done')

	function openCreateModal() {
		editingTask = null
		isModalOpen = true
	}

	function openEditModal(task: any) {
		editingTask = task
		isModalOpen = true
	}

	async function refreshTasks() {
		isModalOpen = false
		await tasksStore.loadTasks({ projectId, eventId, sectionId })
	}

	// --- DRAG & DROP SÉCURISÉ ---
	function handleDragStart(e: DragEvent, task: any) {
		isDragging = true // On met en pause le temps réel
		if (e.dataTransfer) e.dataTransfer.setData('text/plain', task.id.toString())
	}

	function handleDragEnd() {
		isDragging = false // On réactive le temps réel
	}

	async function handleDrop(event: DragEvent, newStatus: Task['status']) {
		event.preventDefault()
		isDragging = false // Réactivation

		const taskIdStr = event.dataTransfer?.getData('text/plain')
		if (!taskIdStr) return
		const taskId = parseInt(taskIdStr, 10)
		const task = $tasksStore.find(t => t.id === taskId)

		if (task && task.status !== newStatus) {
			try {
				await fetch(`/api/tasks/${taskId}`, {
					method: 'PUT', headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ status: newStatus })
				})
				await tasksStore.loadTasks({ projectId, eventId, sectionId })
			} catch (err) { console.error(err) }
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault()
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
	}
</script>

<Toaster position="bottom-right" />

<div class="m-1 relative bg-white border border-gray-200 p-6 rounded-xl shadow-sm">

	<!-- HEADER & FILTRES AVANCÉS -->
	<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
				Gestion des Tâches
				<!-- Petit indicateur "Temps réel actif" discret -->
				<span class="flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
         <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
         </span>
         Sync
       </span>
			</h1>
			<p class="text-sm text-gray-500 mt-1">Gérez l'avancement du projet en temps réel.</p>
		</div>

		<div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
			<!-- NOUVEAU : Filtre par membre -->
			<div class="relative w-full md:w-48">
				<select bind:value={filterAssignee} class="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] text-gray-700 focus:ring-1 focus:ring-[#6b9ad9] focus:border-[#6b9ad9] outline-none bg-gray-50">
					<option value="all">👥 Tous les membres</option>
					{#each participants as p}
						<option value={p.user?.id || p.id}>{p.user?.firstName || p.firstName} {p.user?.lastName || p.lastName}</option>
					{/each}
				</select>
			</div>

			<div class="relative flex-1 md:w-56">
				<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
				<input type="text" bind:value={searchQuery} placeholder="Rechercher..." class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-1 focus:ring-[#6b9ad9] focus:border-[#6b9ad9] outline-none" />
			</div>

			<button on:click={openCreateModal} class="px-4 py-2 bg-[#6b9ad9] hover:bg-[#5a86c4] text-white font-medium rounded-md text-[13px] transition-colors shadow-sm flex items-center gap-2">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
				Nouvelle tâche
			</button>
		</div>
	</div>

	<div class="flex gap-6 border-b border-gray-200 mb-6">
		<button on:click={() => activeFilter = 'all'} class="text-sm pb-3 border-b-2 transition-colors {activeFilter === 'all' ? 'text-[#6b9ad9] border-[#6b9ad9] font-medium' : 'text-gray-500 border-transparent hover:text-gray-700'}">Aperçu ({filteredTasks.length})</button>
		<button on:click={() => activeFilter = 'urgent'} class="text-sm pb-3 border-b-2 transition-colors flex items-center gap-1.5 {activeFilter === 'urgent' ? 'text-gray-900 border-gray-900 font-medium' : 'text-gray-500 border-transparent hover:text-gray-700'}">
			Urgentes
		</button>
		<button on:click={() => activeFilter = 'overdue'} class="text-sm pb-3 border-b-2 transition-colors flex items-center gap-1.5 {activeFilter === 'overdue' ? 'text-red-600 border-red-600 font-medium' : 'text-gray-500 border-transparent hover:text-gray-700'}">
			En retard
		</button>
	</div>

	<!-- COLONNES KANBAN -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
		<!-- À FAIRE -->
		<div class="bg-gray-50/80 rounded-lg p-3.5 border border-gray-100 flex flex-col min-h-[400px]" on:dragover={handleDragOver} on:drop={(e) => handleDrop(e, 'todo')}>
			<div class="flex justify-between items-center mb-4 px-1">
				<h3 class="font-bold text-gray-700 text-xs tracking-wider uppercase flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-slate-400"></span> À faire</h3>
				<span class="text-gray-500 text-xs font-medium bg-gray-200/60 px-2 py-0.5 rounded">{todoTasks.length}</span>
			</div>
			<div class="flex-1 space-y-3 pb-2">
				{#each todoTasks as task (task.id)}
					<div animate:flip={{ duration: 250 }} in:fade={{ duration: 200 }}>
						<!-- 🔥 On intercepte les événements de drag pour sécuriser le temps réel -->
						<div on:dragstart={(e) => handleDragStart(e, task)} on:dragend={handleDragEnd}>
							<TaskCard {task} on:edit={(e) => openEditModal(e.detail)} />
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- EN COURS -->
		<div class="bg-gray-50/80 rounded-lg p-3.5 border border-gray-100 flex flex-col min-h-[400px]" on:dragover={handleDragOver} on:drop={(e) => handleDrop(e, 'in_progress')}>
			<div class="flex justify-between items-center mb-4 px-1">
				<h3 class="font-bold text-gray-700 text-xs tracking-wider uppercase flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-amber-400"></span> En cours</h3>
				<span class="text-gray-500 text-xs font-medium bg-gray-200/60 px-2 py-0.5 rounded">{inProgressTasks.length}</span>
			</div>
			<div class="flex-1 space-y-3 pb-2">
				{#each inProgressTasks as task (task.id)}
					<div animate:flip={{ duration: 250 }} in:fade={{ duration: 200 }}>
						<div on:dragstart={(e) => handleDragStart(e, task)} on:dragend={handleDragEnd}>
							<TaskCard {task} on:edit={(e) => openEditModal(e.detail)} />
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- TERMINÉ -->
		<div class="bg-gray-50/80 rounded-lg p-3.5 border border-gray-100 flex flex-col min-h-[400px]" on:dragover={handleDragOver} on:drop={(e) => handleDrop(e, 'done')}>
			<div class="flex justify-between items-center mb-4 px-1">
				<h3 class="font-bold text-gray-700 text-xs tracking-wider uppercase flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-400"></span> Terminé</h3>
				<span class="text-gray-500 text-xs font-medium bg-gray-200/60 px-2 py-0.5 rounded">{doneTasks.length}</span>
			</div>
			<div class="flex-1 space-y-3 pb-2">
				{#each doneTasks as task (task.id)}
					<div animate:flip={{ duration: 250 }} in:fade={{ duration: 200 }}>
						<div on:dragstart={(e) => handleDragStart(e, task)} on:dragend={handleDragEnd}>
							<TaskCard {task} on:edit={(e) => openEditModal(e.detail)} />
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

{#if isModalOpen}
	<TaskModal
		task={editingTask}
		{projectId} {eventId} {sectionId} {participants}
		on:close={() => isModalOpen = false}
		on:saved={refreshTasks}
		on:deleted={refreshTasks}
	/>
{/if}