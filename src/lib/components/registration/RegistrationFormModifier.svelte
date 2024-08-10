<script lang="ts">
	import type { Registration } from '$lib/types/Registration';
	import RegistrationFormItemModifier from './RegistrationFormItemModifier.svelte';

	export let registration: Registration;
	export let disabled: boolean;

	let formTypes = ['text', 'checkbox', 'select', 'multiple'];
	let formType = 'text';
</script>

<h1 class="text-2xl font-bold">Form</h1>
<div>
	{#if !disabled}
		<select class="border border-gray-100" bind:value={formType} {disabled}>
			{#each formTypes as types}
				<option value={types}>{types}</option>
			{/each}
		</select>

		<button
			class="bg-rose-500 text-white p-2 rounded m-1"
			on:click={() => {
				registration.form.push({
					text: '',
					type: formType,
					registration_id: 0,
					id:
						registration.form.length > 0
							? Math.max(...registration.form.map((f) => f.id ?? 0)) + 1
							: 1
				});
				registration = registration;
			}}
		>
			Add a form
		</button>
	{/if}
</div>

{#if registration.form}
	{#each registration.form as form}
		<div class="grid grid-cols-1 gap-1 border my-1">
			<RegistrationFormItemModifier bind:form bind:disabled />
			<div
				class="flex"
			>
				<select class="border border-gray-100" bind:value={form.type} {disabled}>
					{#each formTypes as types}
						<option value={types}>{types}</option>
					{/each}
				</select>

				{#if !disabled}
					<button
						class="m-1 flex items-center justify-center"
						on:click={() => {
							registration.form = registration.form.filter((f) => f.text !== form.text);
							registration = registration;
						}}
					>
						<span class="icon-[tabler--trash]" style="width: 1.2rem; height: 1.2rem; color: black;"
						></span>
					</button>
				{/if}
			</div>
		</div>
	{/each}
{/if}
