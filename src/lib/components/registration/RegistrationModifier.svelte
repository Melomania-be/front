<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Registration } from '$lib/types/Registration';
	import Fa from 'svelte-fa';
	import RichTextEditor from '../callsheet/RichTextEditor.svelte';
	import RegistrationFormModifier from './RegistrationFormModifier.svelte';
	import RegistrationShow from './RegistrationShow.svelte';
	import {
		faChevronDown,
		faChevronUp,
		faPenToSquare,
		faTrash,
		faTrashCan,
		type IconDefinition
	} from '@fortawesome/free-solid-svg-icons';

	import { slide } from 'svelte/transition';
	import { tick } from 'svelte';

	export let registration: Registration;
	export let projectId: number;
	export let mode: 'modify' | 'create';

	let allowModification = mode === 'modify' ? false : true;

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
					id: f.id ?? null,
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
			goto(`/projects/${projectId}/management/registration`);
		}
		//else {
		//alert('An error occured');
		//}
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

	let displayInfo: boolean = false;
	let chevronInfo: IconDefinition = faChevronDown;

	let displayForm: boolean = false;
	let chevronForm: IconDefinition = faChevronDown;
</script>

<div class="grid grid-cols-2 bg-[#E7E7E7] min-h-screen p-4">
	{#if registration}
		<div
			class="m-1 relative max-w-xxl bg-white border-2 border-gray-400 p-4 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
		>
			<div class=" flex items-center">
				{#if registration.id}
					<button
						class="text-white font-semibold bg-[#6b9ad9] p-1 px-3 rounded-lg"
						on:click={() => goto(`/registration/${projectId}`)}>Link to registration sheet</button
					>
				{/if}
				{#if mode === 'modify'}
					<div class="mr-0 ml-auto">
						<button
							on:click={() => (allowModification = !allowModification)}
							class="text-white dark:text-gray-400 hover:bg-[#4f7cb7] dark:hover:text-gray-300 ml-auto bg-[#6B9AD9] p-1.5 rounded-md font-semibold items-center"
						>
							{#if !allowModification}
								<Fa icon={faPenToSquare} class="text-[20px]" style="color: white" />
							{:else}
								<span class="text-sm">Stop editing</span>
							{/if}
						</button>
					</div>
				{/if}
			</div>

			<div class="m-1  min-h-[90%]">
				<h1 class="text-2xl font-bold text-center uppercase mb-4">Registration Editor</h1>
				<div class="bg-gray-200 p-4 rounded-xl">
					<div class="flex items-center gap-4">
						<h4 class="font-bold text-lg mb-4 uppercase">INFORMATION</h4>
						<button
							class="mb-4"
							on:click={() => {
								displayInfo = !displayInfo;
								if (chevronInfo === faChevronDown) {
									chevronInfo = faChevronUp;
								} else {
									chevronInfo = faChevronDown;
								}
							}}
						>
							<Fa icon={chevronInfo} style="color : black" />
						</button>
					</div>
					{#if displayInfo}
						<div in:slide={{ duration: 300 }} out:slide={{ duration: 200 }}>
							{#if allowModification}
								<button
									class="bg-red-400 text-white p-2 rounded m-1 mb-4 font-semibold"
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
									{#each registration.contents as content}
										<div
											class="grid grid-cols-1 gap-2 bg-white border-2 border-gray-400 rounded-xl p-2 mb-4"
										>
											<div class="flex items-center justify-center">
												<input
													class=" flex-1 text-lg font-semibold rounded-lg bg-blue-200 pl-4"
													type="text"
													placeholder="Title"
													bind:value={content.title}
													disabled={!allowModification}
												/>
												{#if allowModification}
													<button
														class="m-1 ml-4 flex items-center justify-center"
														on:click={() => {
															registration.contents = registration.contents.filter(
																(c) => c.title !== content.title || c.text !== content.text
															);
															registration = registration;
														}}
													>
														<Fa icon={faTrash} class="text-[16px]" style="color: #6b9ad9" />
													</button>
												{/if}
											</div>
											{#if allowModification}
												<div class=" {allowModification ? '' : 'hidden'} h-auto mb-12">
													<RichTextEditor
														value={content.text}
														onChange={(v) => (content.text = v)}
													/>
												</div>
											{:else}
												<div class="prose dark:prose-invert max-w-none">{@html content.text}</div>
											{/if}
										</div>
									{/each}
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<div class="bg-gray-200 p-4 rounded-xl mt-8">
					<div class="flex items-center gap-4">
						<h4 class="font-bold text-lg mb-4 uppercase">FORM</h4>
						<button
							class="mb-4"
							on:click={() => {
								displayForm = !displayForm;
								if (chevronForm === faChevronDown) {
									chevronForm = faChevronUp;
								} else {
									chevronForm = faChevronDown;
								}
							}}
						>
							<Fa icon={chevronForm} style="color : black" />
						</button>
					</div>
					{#if displayForm}
						<div in:slide={{ duration: 300 }} out:slide={{ duration: 200 }}>
							<RegistrationFormModifier disabled={!allowModification} bind:registration />
						</div>
					{/if}
				</div>
			</div>
			<div class="flex justify-center w-full gap-4 mt-4">
				{#if allowModification}
					<button
						on:click={saveregistration}
						class="hover:bg-[#4f7cb7] bg-[#6B9AD9] text-white font-bold py-2 px-4 rounded flex-1"
					>
						Save
					</button>
					{#if mode == 'modify'}
						<button
							on:click={deleteregistration}
							class="bg-red-400 hover:bg-red-500 text-white font-bold py-2 px-4 rounded flex-1"
						>
							Delete
						</button>
					{/if}
				{/if}
			</div>
		</div>

		<div class="">
			<RegistrationShow bind:registration {projectId} registrationModifierMode={true} />
		</div>
	{/if}
</div>
