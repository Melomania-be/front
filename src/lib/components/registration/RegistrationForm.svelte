<script lang="ts">
	import type { Answer } from '$lib/types/Answer';
	import type { Form } from '$lib/types/Form';

	export let form: Form;
	export let answers: Answer[];

	if (!(answers.filter((answer) => answer.form_id === form.id).length > 0)) {
		answers.push({ form_id: form.id, text: '' });
	}
	let currentAnswer = answers.filter((answer) => answer.form_id === form.id)[0];
</script>

{#if form}
	{#if form.type === 'text'}
		<div>
			<label for="form-{form.id}">{form.text}</label>
			<input id="form-{form.id}" type="text" bind:value={currentAnswer.text} class="border rounded" />
		</div>
	{/if}
{/if}
