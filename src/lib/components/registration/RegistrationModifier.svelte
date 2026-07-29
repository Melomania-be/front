<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Registration } from '$lib/types/Registration';
	import Fa from 'svelte-fa';
	import RichTextEditor from '../callsheet/RichTextEditor.svelte';
	import RegistrationFormModifier from './RegistrationFormModifier.svelte';
	import RegistrationShow from './RegistrationShow.svelte';
	import {
		faChevronDown,
		faChevronLeft,
		faChevronUp,
		faPenToSquare,
		faTrash,
		type IconDefinition
	} from '@fortawesome/free-solid-svg-icons';

	import { slide } from 'svelte/transition';
	import { onMount } from 'svelte';

	export let registration: Registration;
	export let projectId: number;
	export let mode: 'modify' | 'create';

	let allowModification = mode === 'modify' ? false : true;

	async function saveregistration() {
		const tmpRegistration = {
			content: registration.contents.map((c, index) => {
				return {
					title: c.title,
					text: c.text,
					order: c.order ?? index,
					position: c.position ?? 'below'
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
			popUpSave = true;
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

	let displayInfo: boolean = false;
	let chevronInfo: IconDefinition = faChevronDown;

	let displayForm: boolean = false;
	let chevronForm: IconDefinition = faChevronDown;

	let popUpSave: boolean = false;

	let isMobile = false;
	let screenDirection: 'horizontal' | 'vertical' = 'vertical';

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};

	const checkDirection = () => {
		screenDirection = window.innerWidth > window.innerHeight ? 'horizontal' : 'vertical';
	};

	onMount(() => {
		checkMobile();
		checkDirection();
		window.addEventListener('resize', checkMobile);
		window.addEventListener('resize', checkDirection);

		// Initialize order and position for existing contents
		if (registration.contents) {
			registration.contents = registration.contents.map((content, index) => ({
				...content,
				order: content.order ?? index,
				position: content.position ?? 'below'
			}));
		}

		return () => {
			window.removeEventListener('resize', checkMobile);
			window.removeEventListener('resize', checkDirection);
		};
	});

	function moveUp(index: number) {
		if (index === 0) return;
		const contents = [...registration.contents];
		[contents[index - 1], contents[index]] = [contents[index], contents[index - 1]];
		contents.forEach((c, i) => (c.order = i));
		registration.contents = contents;
	}

	function moveDown(index: number) {
		if (index === registration.contents.length - 1) return;
		const contents = [...registration.contents];
		[contents[index], contents[index + 1]] = [contents[index + 1], contents[index]];
		contents.forEach((c, i) => (c.order = i));
		registration.contents = contents;
	}
</script>

{#if popUpSave}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div class="bg-white p-6 rounded-xl shadow-xl w-[50%] text-center flex flex-col items-center justify-center">
			<h2 class="text-lg font-semibold mb-2">Changes saved successfully</h2>
			<button
				class="mt-4 w-[30%] px-4 py-2 bg-[#6b9ad9] text-white rounded"
				on:click={() => {
					popUpSave = false;
					allowModification = false;
					goto(`/projects/${projectId}/management/registration`);
				}}>OK</button
			>
		</div>
	</div>
{/if}

<div class="bg-[#E7E7E7] px-6 py-4">
	<div class="bg-[#6b9ad9] hover:bg-[#4f7cb7] text-white font-semibold justify-center flex items-center gap-2 rounded-lg py-1 w-[100px]">
		<Fa icon={faChevronLeft} class="text-[14px]" style="color: white;" />
		<a href={`/projects/${projectId}/management`}>Back</a>
	</div>
</div>

<div class="grid {isMobile ? 'grid-cols-1' : 'grid-cols-2'} bg-[#E7E7E7] min-h-screen pt-2 p-4">
	{#if registration}
		<div class="m-1 relative max-w-xxl bg-white border-2 border-gray-400 p-4 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
			<div class="flex items-center">
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

			<div class="m-1 min-h-[90%]">
				<h1 class="text-2xl font-bold text-center uppercase mb-4">Registration Editor</h1>
				<div class="bg-gray-200 p-4 rounded-xl">
					<div class="flex items-center gap-4">
						<h4 class="font-bold text-lg mb-4 uppercase">INFORMATION</h4>
						<button
							class="mb-4"
							on:click={() => {
								displayInfo = !displayInfo;
								chevronInfo = displayInfo ? faChevronUp : faChevronDown;
							}}
						>
							<Fa icon={chevronInfo} style="color: black" />
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
											order: registration.contents.length,
											position: 'below',
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
									{#each registration.contents as content, index}
										<div class="grid grid-cols-1 gap-2 bg-white border-2 border-gray-400 rounded-xl p-2 mb-4">
											<div class="flex items-center justify-between">
												<span class="text-sm text-gray-500 font-semibold">Block {index + 1}</span>
												{#if allowModification}
													<div class="flex items-center gap-2">
														<!-- Position dropdown -->
														<select
															class="border border-gray-300 rounded text-sm p-1"
															bind:value={content.position}
														>
															<option value="above">Above program & events</option>
															<option value="below">Below program & events</option>
														</select>
														<!-- Move up -->
														<button
															class="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
															on:click={() => moveUp(index)}
															disabled={index === 0}
														>
															▲
														</button>
														<!-- Move down -->
														<button
															class="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
															on:click={() => moveDown(index)}
															disabled={index === registration.contents.length - 1}
														>
															▼
														</button>
														<!-- Delete -->
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
													</div>
												{/if}
											</div>
											<div class="flex items-center justify-center">
												<input
													class="flex-1 text-lg font-semibold rounded-lg bg-blue-200 pl-4"
													type="text"
													placeholder="Title"
													bind:value={content.title}
													disabled={!allowModification}
												/>
											</div>
											{#if allowModification}
												<div class="h-auto mb-12">
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
								chevronForm = displayForm ? faChevronUp : faChevronDown;
							}}
						>
							<Fa icon={chevronForm} style="color: black" />
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