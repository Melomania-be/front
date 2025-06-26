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

<div class=" p-2">
	{#if form && answer}
		{#if form.type === 'text'}
			<div class="bg-gray-200 rounded-lg px-3 pb-2">
				<label class="text-sm font-semibold text-gray-600" for="form-{form.id}">{form.text}</label>
				<input
					id="form-{form.id}"
					type="text"
					bind:value={answer.text}
					class="rounded border-2 border-gray-400 w-full "
					{disabled}
				/>
			</div>
		{:else if form.type === 'checkbox'}
			<div class="bg-gray-200 rounded-lg px-3 p-2 flex items-center gap-2">
				<input
				 	class="w-4 h-4 accent-[#6b9ad9] active:accent-[#4f7cb7]"
					id="form-{form.id}"
					type="checkbox"
					checked={answer.text === 'true' ? true : false}
					on:change={() => {
						answer.text = answer.text === 'true' ? 'false' : 'true';
					}}
					{disabled}
				/>
				<label class="text-sm font-semibold text-gray-600" for="form-{form.id}">{form.text}</label>
			</div>
		{:else if form.type === 'select' && form.text.split(':').length > 1}
			<div class="bg-gray-200 rounded-lg px-3 p-2 flex gap-2 flex-col">
				<label class="text-sm font-semibold text-gray-600" for="form-{form.id}">{form.text.split(':')[0]}</label>
				<select class="rounded border-2 border-gray-400 w-full" id="form-{form.id}" bind:value={answer.text} {disabled}>
					{#each form.text.split(':')[1].split(';') as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
			</div>
		{:else if form.type === 'multiple' && form.text.split(':').length > 1}
			<div class="bg-gray-200 rounded-lg px-3 p-2 flex gap-2 flex-col">
				<label class="text-sm font-semibold text-gray-600 break-words w-full" for="form-{form.id}">{form.text.split(':')[0]}</label>
				<div class="ml-1">
				{#each form.text.split(':')[1].split(';') as option}
					<div class=" border">
						<input
							class="w-4 h-4 accent-[#6b9ad9] active:accent-[#4f7cb7]"
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
						<label class="text-gray-600" for="form-{form.id}">{option}</label>
					</div>
				{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>