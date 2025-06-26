<script lang="ts">
	import RichTextEditor from '$lib/components/callsheet/RichTextEditor.svelte';
	import { createEventDispatcher } from 'svelte';
	export let content: string;

	const dispatch = createEventDispatcher();

	function handleChange(newValue: string) {
		// Met à jour la prop liée
		content = newValue;
		// Notifie les parents (permet `on:input`)
		dispatch('input', newValue);
	}
</script>

<div class="h-[300px] mb-10">
<RichTextEditor value={content} onChange={handleChange} />
</div>
