<script lang="ts">
	import type { Form } from '$lib/types/Form';
	import { faCircleRight, faTrash } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';

	export let disabled;
	export let form: Form;

	let selectProcess: string[] = [];
	let selectOptions: string[] = [];

	if ((form.type === 'select' || form.type === 'multiple') && form.text.split(':').length >= 1) {
		selectProcess = form.text.split(':');
		selectProcess.push('');
		selectOptions = selectProcess[1].split(';');
		selectChange();
		console.log(selectProcess);
		console.log(form);
	}

	function selectChange() {
		form.text = selectProcess[0] + ':' + selectOptions.join(';');
		console.log(form.text);
	}
</script>

{#if form.type === 'text' || form.type === 'checkbox'}
	<input
		class="border bg-blue-200 rounded-lg font-semibold p-1 px-4 text-black border-gray-100 flex-1"
		type="text"
		placeholder="Form"
		bind:value={form.text}
		{disabled}
	/>
{:else if form.type === 'select'}
	<input
		class="border bg-blue-200 font-semibold rounded-lg p-1 px-4 text-black border-gray-100 flex-1"
		type="text"
		placeholder="Form"
		bind:value={selectProcess[0]}
		on:change={selectChange}
		{disabled}
	/>
	<div>
		{#each selectOptions ?? [] as option}
			<div class="ml-2 flex items-center gap-2">
				<Fa icon={faCircleRight} style="color: #6B9AD9;" />
				<input
					class="border border-gray-100 flex-1 mr-2"
					type="text"
					placeholder="Option"
					bind:value={option}
					on:change={selectChange}
					{disabled}
				/>
				{#if !disabled}
					<button
						class="m-1 flex items-center justify-center"
						on:click={() => {
							selectOptions = selectOptions.filter((o) => o !== option);
							selectOptions = selectOptions;
							selectChange();
							form = form;
						}}
					>
						<Fa icon={faTrash} style="color: #6B9AD9;" />
					</button>
				{/if}
			</div>
		{/each}
		{#if !disabled}
			<button
				class="m-1 flex items-center justify-center bg-[#6B9AD9] rounded-lg p-1 text-white font-semibold px-2 text-sm"
				on:click={() => {
					selectOptions.push('');
					selectOptions = selectOptions;
					selectChange();
					form = form;
				}}
				{disabled}
			>
				Add Option
			</button>
		{/if}
	</div>
{:else if form.type === 'multiple'}
	<input
		class="border bg-blue-200 font-semibold rounded-lg p-1 px-4 text-black border-gray-100 flex-1"
		type="text"
		placeholder="Form"
		bind:value={selectProcess[0]}
		on:change={selectChange}
		{disabled}
	/>
	<div>
		{#each selectOptions ?? [] as option}
			<div class="ml-2 flex items-center gap-2">
				<Fa icon={faCircleRight} style="color: #6B9AD9;" />
				<input
					class="flex-1"
					type="text"
					placeholder="Option"
					bind:value={option}
					on:change={selectChange}
					{disabled}
				/>
				{#if !disabled}
					<button
						class="m-1 flex items-center justify-center"
						on:click={() => {
							selectOptions = selectOptions.filter((o) => o !== option);
							selectOptions = selectOptions;
							selectChange();
							form = form;
						}}
					>
						<Fa icon={faTrash} style="color: #6B9AD9;" />
					</button>
				{/if}
			</div>
		{/each}
		{#if !disabled}
			<button
				class="m-1 flex items-center justify-center bg-[#6B9AD9] rounded-lg p-1 text-white font-semi-bold px-2 text-sm font-semibold"
				on:click={() => {
					selectOptions.push('');
					selectOptions = selectOptions;
					selectChange();
					form = form;
				}}
				{disabled}
			>
				Add Option
			</button>
		{/if}
	</div>
{/if}
