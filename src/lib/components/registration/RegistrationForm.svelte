<script lang="ts">
	import type { Answer } from '$lib/types/Answer';
	import type { Form } from '$lib/types/Form';

	export let forms: Form[];
	export let answer: Answer;
	export let disabled;

	let form: Form;

	$: {
		if (forms.length > 0) {
			form = forms.filter((form) => form.id === answer.formId)[0];
		} else if (answer.form) {
			form = answer.form;
		}
	}
</script>

{#if form}
	{#if form.type === 'text'}
		<div>
			<label for="form-{form.id}">{form.text}</label>
			<input
				id="form-{form.id}"
				type="text"
				bind:value={answer.text}
				class="border rounded"
				{disabled}
			/>
		</div>
	{/if}
{/if}
