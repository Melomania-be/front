<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	export let task: any

	const dispatch = createEventDispatcher()

	$: bgClass = getBackgroundColor(task)
	$: borderClass = getBorderColor(task)

	function getBackgroundColor(t: any) {
		if (t.status === 'done') return 'bg-gray-50 opacity-75'
		if (!t.dueDate) return 'bg-white hover:bg-gray-50 shadow-sm hover:shadow-md'

		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const due = new Date(t.dueDate)
		const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

		if (diffDays < 0) return 'bg-red-50/50 hover:bg-red-50 shadow-sm border-red-200'
		if (diffDays <= 2) return 'bg-orange-50/50 hover:bg-orange-50 shadow-sm border-orange-200'

		return 'bg-white hover:bg-gray-50 shadow-sm hover:shadow-md'
	}

	function getBorderColor(t: any) {
		if (t.status === 'todo') return 'border-l-4 border-l-slate-400'
		if (t.status === 'in_progress') return 'border-l-4 border-l-amber-400'
		if (t.status === 'done') return 'border-l-4 border-l-emerald-400'
		return 'border-l-4 border-l-gray-300'
	}
</script>

<div
	class="p-3.5 rounded-lg border border-gray-200 {bgClass} {borderClass} transition-all duration-200 cursor-pointer relative group"
	on:click={() => dispatch('edit', task)}
	draggable="true"
	on:dragstart={(e) => {
    if (e.dataTransfer) e.dataTransfer.setData('text/plain', task.id.toString())
  }}
>
	<div class="flex justify-between items-start mb-2.5">
		<h4 class="text-sm font-semibold leading-tight {task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}">
			{task.title}
		</h4>
		{#if task.priority === 'high'}
			<span class="w-2 h-2 mt-1 rounded-full bg-red-500 shrink-0 shadow-sm" title="Priorité Haute"></span>
		{/if}
	</div>

	<div class="flex items-center justify-between mt-3 text-[12px] font-medium">
		<div class="flex items-center gap-3">
			{#if task.dueDate}
        <span class="flex items-center text-gray-500 {bgClass.includes('red') ? 'text-red-600 font-semibold' : bgClass.includes('orange') ? 'text-orange-600 font-semibold' : ''}">
          <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
					{new Date(task.dueDate).toLocaleDateString('fr-FR')}
        </span>
			{/if}
		</div>

		{#if task.subtasks && task.subtasks.length > 0}
			<!-- 🔥 C'est ici : j'ai retiré le :any qui faisait planter Svelte -->
			{@const completed = task.subtasks.filter((s) => s.isCompleted).length}
			<span class="flex items-center text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded text-[11px]">
        <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
				{completed}/{task.subtasks.length}
      </span>
		{/if}
	</div>
</div>