<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Registration } from '$lib/types/Registration';
	import RegistrationShow from './RegistrationShow.svelte';

	export let registration: Registration;
	export let projectId: number;
	export let mode: 'modify' | 'create';

	let allowModification = mode === 'modify' ? false : true;
	let formTypes = ['text'];
	let formType = 'text';

	async function saveregistration() {
		const tmpRegistration = {
			content: registration.contents.map((c) => {
				return {
					title: c.title,
					text: c.text
				};
			}),
			form: registration.form.map((f) => {
				return {
					text: f.text,
					type: f.type
				};
			})
		};
		const response = await fetch(`/api/projects/${projectId}/management/registration`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(tmpRegistration)
		});

		if (response.ok) {
			goto(`/projects/${projectId}/management`);
		} else {
			alert('An error occured');
		}
	}

	async function deleteregistration() {
		const response = await fetch(`/api/projects/${projectId}/management/registration`, {
			method: 'DELETE'
		});

		if (response.ok) {
			goto(`/projects/${projectId}/management`);
		} else {
			alert('An error occured');
		}
	}
</script>

<div class="grid grid-cols-2">
	{#if registration}
		<div
			class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
		>
			{#if mode === 'modify'}
				<div class="absolute top-0 right-0 p-1">
					<button
						on:click={() => (allowModification = !allowModification)}
						class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
					>
						{#if !allowModification}
							<span class="icon-[tabler--edit]" style="width: 1.2rem; height: 1.2rem; color: black;"
							></span>
						{:else}
							Stop editing
						{/if}
					</button>
				</div>
			{/if}

			<div class="m-1">
				<h1 class="text-2xl font-bold">Registration</h1>
				{#if registration.id}
					<div>
						<a class="text-blue-600" href="/registration/{projectId}"
							><h2 class="text-lg">Link to registration sheet</h2></a
						>
					</div>
				{/if}
				{#if allowModification}
					<button
						class="bg-rose-500 text-white p-2 rounded m-1"
						on:click={() => {
							registration.contents.push({
								title: '',
								text: '',
								registration_id: 0,
								id: null,
								createdAt: new Date(),
								updatedAt: new Date()
							});
							registration = registration;
						}}
					>
						Add content
					</button>
				{/if}
				<div>
					{#if registration.contents && registration.contents.length > 0}
						{#each registration.contents as content}<div class="grid grid-cols-1 gap-1">
								<div class="flex items-center justify-center">
									<input
										class="border border-gray-100 flex-1
                                    "
										type="text"
										placeholder="Title"
										bind:value={content.title}
										disabled={!allowModification}
									/>
									{#if allowModification}
										<button
											class="m-1 flex items-center justify-center"
											on:click={() => {
												registration.contents = registration.contents.filter(
													(c) => c.title !== content.title || c.text !== content.text
												);
												registration = registration;
											}}
										>
											<span
												class="icon-[tabler--trash]"
												style="width: 1.2rem; height: 1.2rem; color: black;"
											></span>
										</button>
									{/if}
								</div>
								<textarea
									class="border border-gray-100"
									placeholder="Html content"
									bind:value={content.text}
									disabled={!allowModification}
								></textarea>
							</div>
						{/each}
					{/if}
				</div>
				<h1 class="text-2xl font-bold">Form</h1>
				<div>
					{#if allowModification}
						<select
							class="border border-gray-100"
							bind:value={formType}
							disabled={!allowModification}
						>
							{#each formTypes as types}
								<option value={types}>{types}</option>
							{/each}
						</select>

						<button
							class="bg-rose-500 text-white p-2 rounded m-1"
							on:click={() => {
								registration.form.push({
									text: '',
									type: 'text',
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

				<div></div>
				{#if registration.form}
					{#each registration.form as form}
						<div class="grid grid-cols-1 gap-1">
							<div
								class="flex items
                            -center justify-center"
							>
								<input
									class="border border-gray-100 flex-1"
									type="text"
									placeholder="Form"
									bind:value={form.text}
									on:change={() => {
										registration = registration;
									}}
									disabled={!allowModification}
								/>
								{#if allowModification}
									<button
										class="m-1 flex items-center justify-center"
										on:click={() => {
											registration.form = registration.form.filter((f) => f.text !== form.text);
											registration = registration;
										}}
									>
										<span
											class="icon-[tabler--trash]"
											style="width: 1.2rem; height: 1.2rem; color: black;"
										></span>
									</button>
								{/if}
							</div>
							<select
								class="border border-gray-100"
								bind:value={form.type}
								disabled={!allowModification}
							>
								{#each formTypes as types}
									<option value={types}>{types}</option>
								{/each}
							</select>
						</div>
					{/each}
				{/if}

				{#if allowModification}
					<div>
						<button
							on:click={saveregistration}
							class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
						>
							Save
						</button>
						{#if mode == 'modify'}
							<button
								on:click={deleteregistration}
								class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
							>
								Delete
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
		<RegistrationShow bind:registration {projectId} />
	{/if}
</div>
