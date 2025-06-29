<script lang="ts">
	import type { Registration } from '$lib/types/Registration';
	import { faTrash } from '@fortawesome/free-solid-svg-icons';
	import RegistrationFormItemModifier from './RegistrationFormItemModifier.svelte';
	import Fa from 'svelte-fa';

	export let registration: Registration;
	export let disabled: boolean;

	let formTypes = ['text', 'checkbox', 'select', 'multiple'];
	let formType = 'text';
</script>


<div>
	{#if !disabled}
		<select class="border-2 rounded-lg border-gray-400" bind:value={formType} {disabled}>
			{#each formTypes as types}
				<option value={types}>{types}</option>
			{/each}
		</select>

		<button
			class="bg-red-400 text-white p-2 rounded m-1 font-semibold"
			on:click={() => {
				registration.form.push({
					text: '',
					type: formType,
					registration_id: 0,
					id: null
				});
				registration = registration;
			}}
		>
			Add a form
		</button>
	{/if}
</div>

{#if registration.form}
	{#each registration.form.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) as form}
		<div class="flex flex-col border-2 gap-2 border-gray-400 rounded-xl p-2 bg-white my-4">
			<RegistrationFormItemModifier bind:form bind:disabled />
			<div
				class="flex ml-auto mr-0 mb-1"
			>
				<select class="border-2 border-gray-400 rounded-lg text-gray-500" bind:value={form.type} {disabled}>
					{#each formTypes as types}
						<option value={types}>{types}</option>
					{/each}
				</select>

				{#if !disabled}
					<button
						class="m-1 flex items-center justify-center bg-red-400 rounded-md p-1"
						on:click={() => {
							registration.form = registration.form.filter((f) => f.text !== form.text);
							registration = registration;
						}}
					>
						<Fa icon={faTrash} class="text-[16px]" style="color: white;" />
					</button>
				{/if}
			</div>
		</div>
	{/each}
{/if}
