<script lang="ts">
	import type { Form } from '$lib/types/Form';

	export let disabled;
	export let form: Form;

	let selectProcess: string[] = [];
	let selectOptions: string[] = [];

	if (
		(form.type === 'select' || form.type === 'multiple') &&
		form.text.split(':').length >= 1
	) {
		selectProcess = form.text.split(':');
		selectProcess.push('');
		selectOptions = selectProcess[1].split(';');
		selectChange();
		console.log(selectProcess)
		console.log(form)
	}
	

	function selectChange() {
		form.text = selectProcess[0] + ':' + selectOptions.join(';');
		console.log(form.text);
	}
</script>

{#if form.type === 'text' || form.type === 'checkbox'}
	<input
		class="border border-gray-100 flex-1"
		type="text"
		placeholder="Form"
		bind:value={form.text}
		{disabled}
	/>
{:else if form.type === 'select'}
	<input
		class="border border-gray-100 flex-1"
		type="text"
		placeholder="Form"
		bind:value={selectProcess[0]}
		on:change={selectChange}
		{disabled}
	/>
	<div>
		{#each selectOptions ?? [] as option}
			<div class="flex">
				<input
					class="border border-gray-100 flex-1"
					type="text"
					placeholder="Option"
					bind:value={option}
					on:change={selectChange}
					{disabled}
				/>
				<button
					class="m-1 flex items-center justify-center"
					on:click={() => {
						selectOptions = selectOptions.filter((o) => o !== option);
						selectOptions = selectOptions;
						selectChange();
						form = form;
					}}
				>
					<span class="icon-[tabler--trash]" style="width: 1.2rem; height: 1.2rem; color: black;"
					></span>
				</button>
			</div>
		{/each}
		<button
			class="m-1 flex items-center justify-center"
			on:click={() => {
				selectOptions.push('');
				selectOptions = selectOptions;
				selectChange();
				form = form;
			}}
			{disabled}
		>
			<span class="icon-[tabler--plus]" style="width: 1.2rem; height: 1.2rem; color: black;"></span>
		</button>
	</div>
{:else if form.type === 'multiple'}
	<input
		class="border border-gray-100 flex-1"
		type="text"
		placeholder="Form"
		bind:value={selectProcess[0]}
		on:change={selectChange}
		{disabled}
	/>
	<div>
		{#each selectOptions ?? [] as option}
			<div class="flex">
				<input
					class="border border-gray-100 flex-1"
					type="text"
					placeholder="Option"
					bind:value={option}
					on:change={selectChange}
					{disabled}
				/>
				<button
					class="m-1 flex items-center justify-center"
					on:click={() => {
						selectOptions = selectOptions.filter((o) => o !== option);
						selectOptions = selectOptions;
						selectChange();
						form = form;
					}}
				>
					<span class="icon-[tabler--trash]" style="width: 1.2rem; height: 1.2rem; color: black;"
					></span>
				</button>
			</div>
		{/each}
		<button
			class="m-1 flex items-center justify-center"
			on:click={() => {
				selectOptions.push('');
				selectOptions = selectOptions;
				selectChange();
				form = form;
			}}
			{disabled}
		>
			<span class="icon-[tabler--plus]" style="width: 1.2rem; height: 1.2rem; color: black;"></span>
		</button>
	</div>
{/if}
