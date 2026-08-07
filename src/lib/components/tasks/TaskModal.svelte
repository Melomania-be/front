<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { fade, slide } from 'svelte/transition'
	import { marked } from 'marked'
	import toast from 'svelte-french-toast'
	import dayjs from 'dayjs'
	import relativeTime from 'dayjs/plugin/relativeTime'
	import 'dayjs/locale/fr'

	dayjs.extend(relativeTime)
	dayjs.locale('fr')

	const dispatch = createEventDispatcher()

	// 👈 On reçoit la tâche entière
	export let task: any = null
	export let projectId: number | undefined = undefined
	export let eventId: number | undefined = undefined
	export let sectionId: number | undefined = undefined
	export let participants: any[] = []

	let loading = false
	let isEditingDesc = false

	// On déduit l'ID
	let taskId = task ? task.id : null

	// 🔥 PRÉ-REMPLISSAGE INSTANTANÉ DES CHAMPS
	let formTitle = task ? task.title : ''
	let formDescription = task?.description || ''
	let formType = task?.taskType || 'logistic'
	let formPriority = task?.priority || 'medium'
	let formStatus = task?.status || 'todo'
	let formAssigneeId = task?.assigneeId || null
	let formDueDate = task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
	let hasDueDate = !!formDueDate
	const todayDate = new Date().toISOString().split('T')[0]

	let subtasks: any[] = []
	let comments: any[] = []
	let newSubtaskTitle = ''
	let newCommentContent = ''

	onMount(async () => {
		if (taskId) {
			try {
				const res = await fetch(`/api/tasks/${taskId}`)
				if (res.ok) {
					const data = await res.json()
					// 💡 On ne charge QUE les sous-tâches et les commentaires, le titre ne clignote plus !
					subtasks = data.subtasks || []
					comments = data.comments || []
				} else {
					toast.error("Erreur de chargement")
				}
			} catch (e) { toast.error("Erreur réseau") }
		} else {
			isEditingDesc = true
		}
	})

	async function saveTask(e: Event) {
		e.preventDefault()
		if (!formTitle.trim()) return
		try {
			loading = true
			const payload = {
				title: formTitle, description: formDescription, taskType: formType,
				priority: formPriority, status: formStatus, projectId, eventId, sectionId,
				assigneeId: formAssigneeId ?? undefined, dueDate: hasDueDate && formDueDate ? formDueDate : null
			}
			const method = taskId ? 'PUT' : 'POST'
			const url = taskId ? `/api/tasks/${taskId}` : '/api/tasks'
			const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
			if(res.ok) {
				toast.success(taskId ? "Modifications enregistrées" : "Tâche créée avec succès")
				dispatch('saved')
			} else { toast.error("Erreur d'enregistrement") }
		} catch (err) { toast.error("Erreur serveur") } finally { loading = false }
	}

	async function deleteTask() {
		if (!confirm("Confirmez-vous la suppression de cette tâche ?")) return
		try {
			loading = true
			const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
			if(res.ok) {
				toast.success("Tâche supprimée")
				dispatch('deleted')
			} else { toast.error("Erreur de suppression") }
		} catch (err) { toast.error("Erreur serveur") } finally { loading = false }
	}

	async function addSubtask() {
		if (!newSubtaskTitle.trim() || !taskId) return
		try {
			const res = await fetch(`/api/tasks/${taskId}`, {
				method: 'PUT', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ _action: 'add_subtask', title: newSubtaskTitle })
			})
			if (res.ok) {
				subtasks = [...subtasks, await res.json()]
				newSubtaskTitle = ''
			} else toast.error("Action impossible")
		} catch (e) { toast.error("Erreur serveur") }
	}

	async function toggleSubtask(subtask: any) {
		try {
			const res = await fetch(`/api/tasks/${taskId}`, {
				method: 'PUT', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ _action: 'toggle_subtask', subtaskId: subtask.id, isCompleted: !subtask.isCompleted })
			})
			if (res.ok) subtasks = subtasks.map(s => s.id === subtask.id ? { ...s, isCompleted: !s.isCompleted } : s)
		} catch (e) { toast.error("Erreur serveur") }
	}

	async function deleteSubtask(subtaskId: number) {
		try {
			const res = await fetch(`/api/tasks/${taskId}`, {
				method: 'PUT', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ _action: 'delete_subtask', subtaskId })
			})
			if (res.ok) subtasks = subtasks.filter(s => s.id !== subtaskId)
		} catch (e) { toast.error("Erreur serveur") }
	}

	async function addComment() {
		if (!newCommentContent.trim() || !taskId) return
		try {
			const res = await fetch(`/api/tasks/${taskId}`, {
				method: 'PUT', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ _action: 'add_comment', content: newCommentContent })
			})
			if (res.ok) {
				comments = [...comments, await res.json()]
				newCommentContent = ''
			} else toast.error("Action impossible")
		} catch (e) { toast.error("Erreur serveur") }
	}

	async function deleteComment(commentId: number) {
		try {
			const res = await fetch(`/api/tasks/${taskId}`, {
				method: 'PUT', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ _action: 'delete_comment', commentId })
			})
			if (res.ok) comments = comments.filter((c: any) => c.id !== commentId)
		} catch (e) { toast.error("Erreur serveur") }
	}
</script>

<div transition:fade={{ duration: 150 }} class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
	<div transition:slide={{ duration: 200 }} class="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">

		<!-- HEADER -->
		<div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
			<h3 class="font-semibold text-gray-900 text-lg tracking-tight">{taskId ? 'Détails de la tâche' : 'Nouvelle tâche'}</h3>
			<button type="button" on:click={() => dispatch('close')} class="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors">
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
			</button>
		</div>

		<!-- BODY -->
		<div class="flex-1 overflow-y-auto bg-white">
			<div class="flex flex-col md:flex-row h-full">

				<!-- GAUCHE (Formulaire principal) -->
				<div class="w-full md:w-3/5 p-6 border-r border-gray-100">
					<form id="task-form" on:submit|preventDefault={saveTask} class="space-y-6">
						<div>
							<label class="block text-[13px] font-medium text-gray-700 mb-1.5">Titre de la tâche</label>
							<input type="text" bind:value={formTitle} required placeholder="Saisissez un titre clair..." class="w-full px-3 py-2 border border-gray-300 rounded-md text-[14px] text-gray-900 focus:ring-1 focus:ring-[#6b9ad9] focus:border-[#6b9ad9] focus:outline-none transition-colors" />
						</div>

						<div class="grid grid-cols-2 gap-5">
							<div>
								<label class="block text-[13px] font-medium text-gray-700 mb-1.5">Catégorie</label>
								<select bind:value={formType} class="w-full px-3 py-2 border border-gray-300 rounded-md text-[14px] text-gray-900 focus:ring-1 focus:ring-[#6b9ad9] focus:border-[#6b9ad9] outline-none">
									<option value="logistic">Logistique</option>
									<option value="musical">Musicale</option>
									<option value="administrative">Administrative</option>
									<option value="communication">Communication</option>
								</select>
							</div>
							<div>
								<label class="block text-[13px] font-medium text-gray-700 mb-1.5">Niveau de priorité</label>
								<select bind:value={formPriority} class="w-full px-3 py-2 border border-gray-300 rounded-md text-[14px] text-gray-900 focus:ring-1 focus:ring-[#6b9ad9] focus:border-[#6b9ad9] outline-none">
									<option value="low">Basse</option>
									<option value="medium">Moyenne</option>
									<option value="high">Haute</option>
								</select>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-5">
							<div>
								<label class="block text-[13px] font-medium text-gray-700 mb-1.5">Assigné à</label>
								<select bind:value={formAssigneeId} class="w-full px-3 py-2 border border-gray-300 rounded-md text-[14px] text-gray-900 focus:ring-1 focus:ring-[#6b9ad9] focus:border-[#6b9ad9] outline-none">
									<option value={null}>Non assigné</option>
									{#each participants as p}
										<option value={p.user?.id || p.id}>{p.user?.firstName || p.firstName} {p.user?.lastName || p.lastName}</option>
									{/each}
								</select>
							</div>

							<div>
								<label class="flex items-center gap-2 text-[13px] font-medium text-gray-700 mb-1.5 cursor-pointer">
									<input type="checkbox" bind:checked={hasDueDate} class="rounded border-gray-300 text-[#6b9ad9] focus:ring-[#6b9ad9]" />
									Date d'échéance
								</label>
								<input type="date" bind:value={formDueDate} min={todayDate} disabled={!hasDueDate} required={hasDueDate} class="w-full px-3 py-2 border border-gray-300 rounded-md text-[14px] disabled:bg-gray-100 disabled:text-gray-400 focus:ring-1 focus:ring-[#6b9ad9] outline-none" />
							</div>
						</div>

						{#if taskId}
							<div>
								<label class="block text-[13px] font-medium text-gray-700 mb-1.5">Statut actuel</label>
								<select bind:value={formStatus} class="w-full px-3 py-2 border border-gray-300 rounded-md text-[14px] text-gray-900 focus:ring-1 focus:ring-[#6b9ad9] focus:border-[#6b9ad9] outline-none">
									<option value="todo">À FAIRE</option>
									<option value="in_progress">EN COURS</option>
									<option value="done">TERMINÉ</option>
								</select>
							</div>
						{/if}

						<div class="pt-2 border-t border-gray-100">
							<div class="flex justify-between items-center mb-2">
								<label class="block text-[13px] font-medium text-gray-700">Description détaillée</label>
								<button type="button" on:click={() => isEditingDesc = !isEditingDesc} class="text-[12px] text-gray-500 hover:text-[#6b9ad9] transition-colors flex items-center">
									{#if isEditingDesc}
										<svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
										Aperçu
									{:else}
										<svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
										Éditer
									{/if}
								</button>
							</div>

							{#if isEditingDesc || !formDescription}
								<textarea bind:value={formDescription} placeholder="Utilisez le Markdown pour formater (**, *, -)" rows="5" class="w-full px-3 py-2 border border-gray-300 rounded-md text-[14px] text-gray-800 focus:ring-1 focus:ring-[#6b9ad9] focus:border-[#6b9ad9] focus:outline-none resize-y"></textarea>
							{:else}
								<div class="w-full px-4 py-3 border border-gray-200 bg-gray-50/50 rounded-md text-[14px] text-gray-800 prose prose-sm max-w-none max-h-[200px] overflow-y-auto cursor-text" on:dblclick={() => isEditingDesc = true}>
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html marked.parse(formDescription)}
								</div>
							{/if}
						</div>
					</form>
				</div>

				<!-- DROITE (Sous-tâches & Commentaires) -->
				<div class="w-full md:w-2/5 bg-gray-50 flex flex-col border-l border-gray-200">
					{#if taskId}

						<!-- SOUS TÂCHES -->
						<div class="p-6 border-b border-gray-200">
							<h4 class="text-[12px] font-bold text-gray-500 tracking-wider uppercase mb-4 flex items-center">
								<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
								Sous-tâches
							</h4>
							<div class="space-y-2 mb-4 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
								{#each subtasks as subtask}
									<div class="flex items-start group text-[13px]">
										<div class="flex items-center h-5">
											<input type="checkbox" checked={subtask.isCompleted} on:change={() => toggleSubtask(subtask)} class="w-4 h-4 rounded border-gray-300 text-[#6b9ad9] focus:ring-[#6b9ad9] cursor-pointer" />
										</div>
										<span class="ml-3 flex-1 text-gray-700 leading-tight {subtask.isCompleted ? 'line-through text-gray-400' : ''}">{subtask.title}</span>
										<button type="button" on:click={() => deleteSubtask(subtask.id)} class="ml-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
										</button>
									</div>
								{:else}
									<p class="text-xs text-gray-400 italic">Aucune sous-tâche définie.</p>
								{/each}
							</div>
							<div class="flex gap-2">
								<input type="text" bind:value={newSubtaskTitle} placeholder="Ajouter un élément..." on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())} class="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-[13px] focus:ring-1 focus:ring-[#6b9ad9] outline-none" />
								<button type="button" on:click={addSubtask} class="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-md text-[12px] transition-colors">Ajouter</button>
							</div>
						</div>

						<!-- COMMENTAIRES -->
						<div class="p-6 flex-1 flex flex-col min-h-[250px]">
							<h4 class="text-[12px] font-bold text-gray-500 tracking-wider uppercase mb-4 flex items-center">
								<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
								Activité
							</h4>
							<div class="flex-1 space-y-4 mb-4 overflow-y-auto pr-2 custom-scrollbar">
								{#each comments as comment}
									<div class="space-y-1">
										<div class="flex justify-between items-baseline">
											<span class="text-[13px] font-semibold text-gray-900">{comment.user?.firstName || 'Utilisateur'}</span>
											<div class="flex items-center gap-2">
												<span class="text-[11px] text-gray-400 capitalize" title={new Date(comment.createdAt).toLocaleString('fr-FR')}>{dayjs(comment.createdAt).fromNow()}</span>
												<button type="button" on:click={() => deleteComment(comment.id)} class="text-gray-300 hover:text-red-500 transition-colors">
													<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
												</button>
											</div>
										</div>
										<div class="bg-white border border-gray-200 p-3 rounded-md text-[13px] text-gray-700 whitespace-pre-wrap shadow-sm">
											{comment.content}
										</div>
									</div>
								{:else}
									<p class="text-xs text-gray-400 italic text-center mt-4">Aucune activité récente.</p>
								{/each}
							</div>
							<div class="mt-auto relative border border-gray-300 rounded-md bg-white focus-within:ring-1 focus-within:ring-[#6b9ad9] focus-within:border-[#6b9ad9] transition-shadow">
								<textarea bind:value={newCommentContent} on:keydown={(e) => e.key === 'Enter' && e.ctrlKey && (e.preventDefault(), addComment())} placeholder="Ajouter un commentaire..." rows="2" class="w-full pl-3 pr-10 py-2 text-[13px] border-none outline-none resize-none bg-transparent rounded-md"></textarea>
								<button type="button" on:click={addComment} class="absolute bottom-2 right-2 p-1.5 text-gray-400 hover:text-[#6b9ad9] rounded transition-colors" title="Envoyer">
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
								</button>
							</div>
						</div>

					{:else}
						<!-- EMPTY STATE CREATION -->
						<div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
							<svg class="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
							<h4 class="text-sm font-medium text-gray-900 mb-1">Tâche non enregistrée</h4>
							<p class="text-xs text-gray-500 max-w-[200px]">Enregistrez d'abord la tâche pour débloquer les sous-tâches et l'espace de commentaires.</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- FOOTER -->
		<div class="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between shrink-0 rounded-b-xl">
			{#if taskId}
				<button type="button" on:click={deleteTask} class="text-[13px] font-medium text-red-600 hover:text-red-800 py-1.5 px-3 hover:bg-red-50 rounded-md transition-colors">Supprimer la tâche</button>
			{:else} <div></div> {/if}
			<div class="flex gap-3">
				<button type="button" on:click={() => dispatch('close')} class="px-5 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors">Annuler</button>
				<button type="submit" form="task-form" disabled={loading} class="px-6 py-2 bg-[#6b9ad9] hover:bg-[#5a86c4] text-white text-[13px] font-medium rounded-md shadow-sm disabled:opacity-50 transition-colors">
					{loading ? 'Traitement...' : 'Enregistrer'}
				</button>
			</div>
		</div>

	</div>
</div>