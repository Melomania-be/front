<!-- Registration forms at the end of the registration page  -->
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

<div class="my-1 p-1">
	{#if form && answer}
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
		{:else if form.type === 'checkbox'}
			<div>
				<input
					id="form-{form.id}"
					type="checkbox"
					checked={answer.text === 'true' ? true : false}
					on:change={() => {
						answer.text = answer.text === 'true' ? 'false' : 'true';
					}}
					{disabled}
				/>
				<label for="form-{form.id}">{form.text}</label>
			</div>
		{:else if form.type === 'select' && form.text.split(':').length > 1}
			<div>
				<label for="form-{form.id}">{form.text.split(':')[0]}</label>
				<select id="form-{form.id}" bind:value={answer.text} class="border rounded" {disabled}>
					{#each form.text.split(':')[1].split(';') as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
			</div>
		{:else if form.type === 'multiple' && form.text.split(':').length > 1}
			<div >
				<label class="font-semibold" for="form-{form.id}">{form.text.split(':')[0]}</label>
				<div class="ml-3">
				{#each form.text.split(':')[1].split(';') as option}
					<div>
						<input
							id="form-{form.id}"
							type="checkbox"
							checked={answer.text.split(';').includes(option)}
							on:change={() => {
								if (answer.text.split(';').includes(option)) {
									answer.text = answer.text
										.split(';')
										.filter((o) => o !== option)
										.join(';');
								} else {
									answer.text = answer.text + ';' + option;
								}
							}}
							{disabled}
						/>
						<label for="form-{form.id}">{option}</label>
					</div>
				{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>