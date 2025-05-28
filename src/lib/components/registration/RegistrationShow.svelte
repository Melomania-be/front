<script lang="ts">
	import type { Answer } from '$lib/types/Answer';
	import type { Registration } from '$lib/types/Registration';
	import type { Participant } from '$lib/types/Participant';
	import RegistrationForm from './RegistrationForm.svelte';
	import DateShow from '../DateShow.svelte';
	import imageBackground from '$lib/assets/BackgrounImage.avif';
	import { Steps } from 'svelte-steps';

	import { comment } from 'postcss';
	import { onMount } from 'svelte';
	import {
		faCalendar,
		faLocationDot,
		faUser,
		faMusic,
		faWarning
	} from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';

	export let registration: Registration;
	export let projectId: number;


	type ParticipantsCountBySection = {
		section_id: number;
		section_name: string | null;
		participants_count: number;
	};

	let participants: ParticipantsCountBySection[] = [];

	onMount(async () => {
		await loadParticipants();
	});

	async function loadParticipants() {
		const response = await fetch(`/api/projects/${projectId}/public/participants-count`);


		if (!response.ok) {
			// Gestion d'erreur simple
			console.error('Erreur lors de la récupération des participants:', response.statusText);
			return;
		}

		const data : ParticipantsCountBySection[] = await response.json();
		console.log('Participants récupérés:', data);

		participants = data;
	}

	let isMobile = false;

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	let step: number = 2;

	let tabName: string = 'event';

	const next = () => step++;
	const prev = () => step--;
	const goTo = (n: number) => (step = n);

	let newContact: {
		first_name: string;
		last_name: string;
		email: string;
		phone: string | null;
		messenger: string | null;
		validated_contact: boolean;
		section_id: number;
		answers: Answer[];
		rehearsals: { id: number; comment: string }[];
		concerts: { id: number; comment: string }[];
	} = {
		first_name: '',
		last_name: '',
		email: '',
		phone: '',
		messenger: '',
		validated_contact: false,
		section_id: 0,
		answers: registration.form
			? registration.form.map((form) => ({ text: '', formId: form.id! }))
			: [],
		rehearsals: [],
		concerts: []
	};

	$: newContact = {
		...newContact,
		answers: registration.form
			? registration.form.map((form) => {
					const answer = newContact.answers.find((answer) => answer.formId === form.id);
					return answer || { text: '', formId: form.id! };
				})
			: []
	};

	function toggleSelection(array: any[], id: number, comment: string) {
		const item = array.find((item) => item.id === id);
		if (item) {
			return array.filter((item) => item.id !== id);
		} else {
			return [...array, { id, comment }];
		}
	}

	function updateComment(array: any[], id: number, comment: string) {
		return array.map((item) => (item.id === id ? { ...item, comment } : item));
	}

	function handleCheckboxChange(event: Event, id: number, type: 'concert' | 'rehearsal') {
		const inputElement = event.target as HTMLInputElement;
		const commentElement = document.getElementById(`comment-${type}-${id}`) as HTMLInputElement;
		const comment = commentElement ? commentElement.value : '';
		if (type === 'concert') {
			newContact.concerts = toggleSelection(
				newContact.concerts,
				id,
				inputElement.checked ? comment : ''
			);
		} else {
			newContact.rehearsals = toggleSelection(
				newContact.rehearsals,
				id,
				inputElement.checked ? comment : ''
			);
		}
	}

	function handleTextInput(event: Event, id: number, type: 'concert' | 'rehearsal') {
		const inputElement = event.target as HTMLInputElement;
		console.log(id);
		if (type === 'concert') {
			console.log(newContact.concerts);
			if (newContact.concerts.some((concert) => concert.id === id)) {
				newContact.concerts = updateComment(newContact.concerts, id, inputElement.value);
			}
		} else {
			if (newContact.rehearsals.some((rehearsal) => rehearsal.id === id)) {
				newContact.rehearsals = updateComment(newContact.rehearsals, id, inputElement.value);
			}
		}
	}

	async function handleSubmit() {
		if (newContact.rehearsals.length !== 0) {
			rehearsalError = false;
		}
		if (newContact.concerts.length !== 0) {
			concertError = false;
		}

		console.log('submit clicked');
		let hasError = false;

		if (newContact.rehearsals.length === 0) {
			rehearsalError = true;
			hasError = true;
		}

		if (newContact.first_name === '' || newContact.last_name === '' || newContact.email === '') {
			//return alert('Please enter every non optional information.');
			hasError = true;
		}

		if (newContact.section_id === 0) {
			//return alert('Please select the section you want to belong to.');
			hasError = true;
		}

		if (newContact.concerts.length === 0) {
			//return alert('Please select the concerts you will attend to (at least one required).');
			concertError = true;
			hasError = true;
		}

		if (newContact.email === '') {
			hasError = true;
		}

		if (hasError) {
			return;
		}

		const data = {
			id: null,
			first_name: newContact.first_name,
			last_name: newContact.last_name,
			email: newContact.email,
			phone: newContact.phone,
			messenger: newContact.messenger,
			validated_contact: false,
			rehearsals: newContact.rehearsals,
			concerts: newContact.concerts,
			project_id: registration.project?.id,
			section_id: newContact.section_id,
			answers: newContact.answers.map((answer) => {
				return {
					form_id: answer.formId,
					text: answer.text ?? ''
				};
			})
		};

		console.log('Data to send:', data);

		const response = await fetch(`/api/registrations/${projectId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});

		const responseText = await response.text();
		console.log('Server response:', responseText);

		if (response.status >= 400 && response.status < 500) {
			const jsonResponse = JSON.parse(responseText);
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		} else if (response.status >= 500) {
			alert('Server error');
		}

		if (response.ok) {
			alert(
				'Registration successful! You will receive news shortly if your registration is accepted.'
			);
			window.location.reload();
		}
	}

	const combinedEvents = [
		...(registration.project?.concerts || []).map((event) => ({ ...event, type: 'concert' })),
		...(registration.project?.rehearsals || []).map((event) => ({ ...event, type: 'rehearsal' }))
	].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

	/* Error Manangement */

	let contactErrors = {
		first_name: false,
		last_name: false,
		email: false,
		validEmail: false,
		section_id: false
	};

	let rehearsalError = false;
	let concertError = false;

	function validateContactFields() {
		contactErrors.first_name = newContact.first_name.trim() === '';
		contactErrors.last_name = newContact.last_name.trim() === '';
		contactErrors.email = newContact.email.trim() === '';
		contactErrors.section_id = newContact.section_id === 0;

		let emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		contactErrors.validEmail = !emailPattern.test(newContact.email);

		return !Object.values(contactErrors).includes(true);
	}

	let showPopup = false;

	let openCommentPopUp = false;
	let commentEventId : number;
	let commentEventType : 'concert' | 'rehearsal' ;

	function showCommentPopUp(id : number , type : 'concert' | 'rehearsal' ){
		commentEventId = id;
		commentEventType = type;

		openCommentPopUp = true;
	}

	function commentPlaceHolder(id : number, type : 'concert' | 'rehearsal' ) : string {
		if(type === 'concert'){
			let comment = newContact.concerts.find((c) => c.id === commentEventId)?.comment;
			if(comment == undefined || comment == ''){
				return 'Write your comment...';
			}
			else{
				return comment;
			}
		}
		else{
			let comment = newContact.rehearsals.find((r) => r.id === commentEventId)?.comment;
			if(comment == undefined || comment == ''){
				return 'Write your comment...';
			}
			else{
				return comment;
			}
		}
	}

</script>

<!-- Image fixe avec filtre -->
<div class="fixed-background">
	<img src={imageBackground} alt="Background" />
	<div class="overlay-filter"></div>
</div>

<!-- POPUP section Full-->
{#if showPopup}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div class="bg-white p-6 rounded-xl shadow-xl w-96 text-center">
			<h2 class="text-lg font-semibold mb-4">Section Full</h2>
			<p>The selected section is full.</p>
			<p>Do you still want to proceed?</p>
			<button
				class="mt-4 w-[30%] mr-6 px-4 py-2 bg-[#6b9ad9] text-white rounded"
				on:click={() => {
					step = 1;
					showPopup = false;
				}}>Cancel</button
			>
			<button
				class="mt-4 w-[30%] ml-6 px-4 py-2 bg-[#6b9ad9] text-white rounded"
				on:click={() => {
					step = 2;
					showPopup = false;
				}}>OK</button
			>
		</div>
	</div>
{/if}

<!-- POPUP Add Comment-->
{#if openCommentPopUp}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div class="bg-white p-6 rounded-xl shadow-xl w-96 text-center">
			<h2 class="text-lg font-semibold mb-4">Add a Comment</h2>
			<input
				id={`comment-${commentEventType}-${commentEventId}`}
				class="bg-[#ebebeb] w-full p-1 pl-2 pr-2 border-3 rounded h-full focus:border-blue-500"
				placeholder={commentPlaceHolder(commentEventId,commentEventType)}
				on:input={(e) =>
					handleTextInput(e, commentEventId ?? 0, commentEventType === 'concert' ? 'concert' : 'rehearsal')}
			/>
			<button
				class="mt-4 w-[30%] ml-6 px-4 py-2 bg-[#6b9ad9] text-white rounded"
				on:click={() => {
					openCommentPopUp = false;
				}}>Close</button
			>
		</div>
	</div>
{/if}

<div class="content">
	{#if registration}
		<h1 class="text-6xl font-bold mb-2 p-3 registration-title">
			Registration to the project : {registration.project?.name || 'No project name available'}
		</h1>
		<div class="registration-bloc">
			<div class="registration-content bg-white w-full h-full">
				<div class="form-head">
					<div class="tabs">
						{#if !isMobile}
							<Steps
								steps={[{ text: 'Project Details' }, { text: 'Contact' }, { text: 'Attendances' }]}
								current={step}
								size="3rem"
								line="3px"
								primary="#7DBBE5"
								secondary="#C7C7C7"
							/>
						{:else}
							<Steps
								steps={[{ text: 'Project' }, { text: 'Contact' }, { text: 'Attendances' }]}
								current={step}
								size="2.5rem"
								line="3px"
								primary="#7DBBE5"
								secondary="#C7C7C7"
							/>
						{/if}
					</div>
					{#if step === 0}
						<div class="tabs-details">
							<button class:active={tabName === 'event'} on:click={() => (tabName = 'event')}
								>Events</button
							>
							<button class:active={tabName === 'program'} on:click={() => (tabName = 'program')}
								>Programs</button
							>
							<button class:active={tabName === 'info'} on:click={() => (tabName = 'info')}
								>Information</button
							>
						</div>
					{/if}
				</div>
				<div class="from-body">
					<!-- Step 1 : Project details -->
					{#if step === 0}
						<div class="form-body-content">
							<div class="pb-5">
								{#if tabName === 'event'}
									{#if !isMobile}
										<div class="mb-3 ml-5 mr-5">
											<!--Events Table-->
											<table
												class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border-separate border-spacing-y-2"
											>
												<thead
													class="text-s text-black uppercase dark:bg-gray-700 dark:text-gray-400"
												>
													<tr>
														<th class="px-6 py-2">Date</th>
														<th class="px-6 py-2">Time</th>
														<th class="px-6 py-2">Place</th>
														<th class="px-6 py-2">Type</th>
														<th class="px-6 py-2">Comment</th>
													</tr>
												</thead>
												<tbody>
													{#if combinedEvents.length > 0}
														{#each combinedEvents as event}
															<tr class="bg-white dark:bg-gray-800">
																<th
																	scope="row"
																	class="px-6 py-3 font-medium whitespace-nowrap dark:text-white border-t-2 border-b-2 border-l-2 border-gray-300 rounded-l-md"
																>
																	<DateShow
																		startTime={event.startDate}
																		endTime={event.endDate}
																		withTime={false}
																		isRehearsal={event.type === 'rehearsal'}
																	/>
																</th>
																<td
																	class="px-6 py-3 font-medium whitespace-nowrap dark:text-white border-t-2 border-b-2 border-gray-300"
																>
																	<DateShow
																		startTime={event.startDate}
																		endTime={event.endDate}
																		withTime={true}
																		withDate={false}
																		isRehearsal={event.type === 'rehearsal'}
																	/>
																</td>
																<td class="px-6 py-3 border-t-2 border-b-2 border-gray-300"
																	>{event.place}</td
																>
																<td class="px-6 py-3 border-t-2 border-b-2 border-gray-300">
																	{#if event.type === 'concert'}
																		<div class="eventTypeConcert">{event.type}</div>
																	{/if}
																	{#if event.type === 'rehearsal'}
																		<div class="eventTypeRehearsal">{event.type}</div>
																	{/if}
																</td>
																<td
																	class="px-6 py-3 border-t-2 border-b-2 border-r-2 border-gray-300 rounded-r-md"
																>
																	{event.comment ? event.comment : 'No comment'}
																</td>
															</tr>
														{/each}
													{:else}
														<tr>
															<td class="px-6 py-4 border border-gray-300" colspan="5"
																>No events found</td
															>
														</tr>
													{/if}
												</tbody>
											</table>
										</div>
									{/if}
									{#if isMobile}
										{#if combinedEvents.length > 0}
											{#each combinedEvents as event}
												<div
													class=" bg-white border-[2px] border-[#989898] pl-[10px] m-[15px] p-[5px] rounded-[12px] text-xs relative"
												>
													<div class=" flex items-center gap-2 ml-2 p-[2px]">
														<Fa icon={faCalendar} class="text-[14px]" style="color: #6B9AD9;" />
														<DateShow
															startTime={event.startDate}
															endTime={event.endDate}
															withTime={false}
															isRehearsal={event.type === 'rehearsal'}
														/>
														<DateShow
															startTime={event.startDate}
															endTime={event.endDate}
															withTime={true}
															withDate={false}
															isRehearsal={event.type === 'rehearsal'}
														/>
													</div>
													<div class=" flex items-center gap-2 ml-2 p-[2px]">
														<Fa icon={faLocationDot} class="text-[14px]" style="color: #6B9AD9;" />
														{event.place}
													</div>
													<div class=" flex items-center gap-2 ml-2 w-[70%]">
														<div
															class="bg-gray-200 flex items-center gap-1 m-1 p-1 rounded-md pl-2 pr-2"
														>
															<p class="text-gray-600">
																<span class="text-black font-bold">Comment :</span>
																{event.comment ? event.comment : 'No comment'}
															</p>
														</div>
													</div>
													{#if event.type === 'rehearsal'}
														<div
															class="absolute font-semibold bottom-[-0.5px] right-[-0.5px] bg-[#6B9AD9] text-white p-2 rounded-tl-2xl rounded-br-[10px]"
														>
															{event.type}
														</div>
													{:else}
														<div
															class="absolute font-semibold bottom-[-0.5px] right-[-0.5px] bg-[#a584d2] text-white p-2 rounded-tl-2xl rounded-br-[10px]"
														>
															{event.type}
														</div>
													{/if}
												</div>
											{/each}
										{:else}
											<tr
												><td class="px-6 py-4 border border-gray-300" colspan="5"
													>No events found</td
												></tr
											>
										{/if}
									{/if}
								{/if}
								{#if tabName === 'program'}
									{#if !isMobile}
										<div class="mb-3 ml-5 mr-5">
											<div class="w-full flex">
												<!--programs and Scores Table-->
												<table
													class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border-separate border-spacing-y-2"
												>
													<thead
														class="text-s text-black uppercase dark:bg-gray-700 dark:text-gray-400"
													>
														<tr>
															<th scope="col" class="px-6 py-2"> Composer </th>
															<th scope="col" class="px-6 py-2"> Title </th>
														</tr>
													</thead>
													<tbody>
														{#if registration.project?.pieces}
															{#each registration.project.pieces as piece}
																<tr class="bg-white dark:bg-gray-800">
																	<td
																		class="px-6 py-3 font-medium whitespace-nowrap dark:text-white border-t-2 border-b-2 border-l-2 border-gray-300 rounded-l-md"
																	>
																		{piece.composer.shortName}
																	</td>
																	<th
																		scope="row"
																		class="px-6 py-3 border-t-2 border-b-2 border-r-2 border-gray-300 rounded-r-md"
																	>
																		{piece.name}
																	</th>
																</tr>
															{/each}
														{:else}
															<tr>
																<td class="px-6 py-4" colspan="3">No pieces found</td>
															</tr>
														{/if}
													</tbody>
												</table>
											</div>
										</div>
									{:else if registration.project?.pieces}
										{#each registration.project.pieces as piece}
											<div
												class="bg-white border-2 border-gray-400 m-2 rounded-2xl text-[13px] flex pl-4 p-2 items-center"
											>
												<div class="flex items-center gap-3 w-[30%]">
													<Fa icon={faUser} style="color: #6B9AD9;" />
													<p>{piece.composer.shortName}</p>
												</div>
												<div class="flex items-center gap-3 ml-5">
													<Fa icon={faMusic} style="color: #6B9AD9;" />
													{piece.name}
												</div>
											</div>
										{/each}
									{:else}
										<p class="px-6 py-4">No pieces found</p>
									{/if}
								{/if}
								{#if tabName === 'info'}
									{#if registration.contents && registration.contents.length > 0}
										<div class="bg-[#ececec] h-full pl-7 pr-7 overflow-y-auto pb-7">
											{#each registration.contents as content}
												<h2
													class="text-2xl font-medium tracking-tight text-black dark:text-white mb-3 mt-5"
												>
													{@html content.title}
												</h2>
												<div class="w-full flex">
													<p class="text-gray-500 dark:text-gray-400 text-justify">
														{@html content.text}
													</p>
												</div>
											{/each}
										</div>
									{/if}
								{/if}
							</div>
						</div>
						<div class="form-body-buttons">
							<div class="bg-white w-full flex justify-center">
								<button class="bg-blue-500 max-w-[30%]" on:click={() => (step = step + 1)}>
									Next
								</button>
							</div>
						</div>
					{/if}
					<!-- Step 2 : Contact -->
					{#if step === 1}
						<div
							class=" ml-6 w-full self-center mb-5 h-full mr-6 flex flex-col gap-3 content-contact"
						>
							<div class="flex flex-col h-16">
								<div
									class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500
									{contactErrors.first_name ? 'text-red-500 placeholder-red-400' : ''}"
									style="width: fit-content;"
								>
									First Name*
								</div>
								<input
									class="p-3 border-2 border-gray-500 rounded-xl focus:outline-none
									{contactErrors.first_name ? 'border-red-500 placeholder-red-400' : ''}"
									bind:value={newContact.first_name}
									placeholder="First name"
									required
								/>
								{#if contactErrors.first_name}
									<div class="text-red-500 text-right text-xs ml-10 mr-2 mt-1">
										First name is required
									</div>
								{/if}
							</div>

							<div class="flex flex-col h-16">
								<div
									class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500
									{contactErrors.last_name ? 'text-red-500 placeholder-red-400' : ''}"
									style="width: fit-content;"
								>
									Last Name*
								</div>
								<input
									class="p-3 border-2 border-gray-500 rounded-xl focus:outline-none
									{contactErrors.last_name ? 'border-red-500 placeholder-red-400' : ''}"
									bind:value={newContact.last_name}
									placeholder="Last name"
									required
								/>
								{#if contactErrors.last_name}
									<div class="text-red-500 text-right text-xs ml-10 mr-2 mt-1">
										Last name is required
									</div>
								{/if}
							</div>

							<div class="flex flex-col h-16">
								<div
									class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500
									{contactErrors.email || contactErrors.validEmail ? 'text-red-500 placeholder-red-400' : ''}"
									style="width: fit-content;"
								>
									Email Adress*
								</div>
								<input
									class="p-3 border-2 border-gray-500 rounded-xl focus:outline-none
									{contactErrors.email || contactErrors.validEmail ? 'border-red-500 placeholder-red-400' : ''}"
									bind:value={newContact.email}
									placeholder="example@email.com"
									required
								/>
								{#if contactErrors.email}
									<div class="text-red-500 text-right text-xs ml-10 mr-2 mt-1">
										Email is required
									</div>
								{/if}
								{#if contactErrors.validEmail}
									<div class="text-red-500 text-right text-xs ml-10 mr-2 mt-1">
										Invalid email address
									</div>
								{/if}
							</div>

							<div class="flex flex-col h-16">
								<div
									class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
									style="width: fit-content;"
								>
									Phone Number
								</div>
								<input
									class="p-3 border-2 border-gray-500 rounded-xl focus:outline-none"
									bind:value={newContact.phone}
									placeholder="Phone Number"
								/>
							</div>

							<div class="flex flex-col h-16">
								<div
									class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
									style="width: fit-content;"
								>
									Messenger
								</div>
								<input
									class="p-3 border-2 border-gray-500 rounded-xl focus:outline-none"
									bind:value={newContact.messenger}
									placeholder="Messenger"
								/>
							</div>

							{#if registration.project?.sectionGroup?.sections}
								<div class="flex flex-col h-16">
									<div
										class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500
										{contactErrors.section_id ? 'text-red-500 placeholder-red-400' : ''}"
										style="width: fit-content;"
									>
										Section*
									</div>

									<select
										class="p-3 border-2 border-gray-500 rounded-xl focus:outline-none
										{contactErrors.section_id ? 'border-red-500 placeholder-red-400' : ''}"
										bind:value={newContact.section_id}
									>
										{#each registration.project.sectionGroup.sections as section}
											<option
												value={section.id}
											>
												{#if (participants.find(p => p.section_id === section.id)?.participants_count ?? 0) >= section.size}
													{section.name} (FULL)
												{:else}
													{section.name}
												{/if}
											</option>
										{/each}
									</select>
									{#if newContact.section_id === 0}
										<div
											class="-mt-[37px] bg-white z-20 ml-3 text-gray-400"
											style="width: fit-content;"
										>
											Section*
										</div>
									{/if}
									{#if contactErrors.section_id}
										<div class="text-red-500 text-right text-xs ml-10 mr-2 mt-4">
											Section is required
										</div>
									{/if}
								</div>
							{/if}
						</div>
						<div class="form-body-buttons">
							<div class="bg-white w-full flex justify-center">
								<button class="bg-blue-500" on:click={() => (step = step - 1)}> Back </button>
								<button
									class="bg-blue-500"
									on:click={() => {
										if (validateContactFields()) {
											newContact.concerts = [];
											newContact.rehearsals = [];
											const selectedSection = registration.project?.sectionGroup?.sections?.find(
												(section) => section.id === newContact.section_id
											);
											if (selectedSection && selectedSection.size) {
												const isFull =
													(participants.find((p) => p.section_id === selectedSection.id)?.participants_count ?? 0) >=
													selectedSection.size;
												if (isFull) {
													showPopup = true;
													return;
												}
											}
											step = step + 1;
										}
									}}
								>
									Next
								</button>
							</div>
						</div>
					{/if}
					{#if step === 2}
						<div
							class="bg-[#ececec] pr-5 pt-5 h-full w-full overflow-y-auto pb-10 form-body-content"
						>
							<div class="ml-6 mr-1">
								<h3 class="text-xl font-bold tracking-tight text-gray-500 dark:text-white mb-2">
									Attendances
								</h3>

								{#if !isMobile}
									<table
										class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border-separate border-spacing-y-2 ml-3"
									>
										<thead class="text-s text-black uppercase dark:bg-gray-700 dark:text-gray-400">
											<tr>
												<th class="px-6 py-3">Select</th>
												<th class="px-6 py-3">Date</th>
												<th class="px-6 py-3">Time</th>
												<th class="px-6 py-3">Location</th>
												<th class="px-6 py-3">Type</th>
												<th class="px-6 py-3">Additional information</th>
												<th class="px-6 py-3">Add a comment</th>
											</tr>
										</thead>
										<tbody
											class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600"
										>
											{#if combinedEvents.length > 0}
												{#each combinedEvents as event}
													<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
														<td
															class="px-6 py-3 font-medium whitespace-nowrap dark:text-white border-t-2 border-b-2 border-l-2 border-gray-300 rounded-l-md"
														>
															<input
																class="w-5 h-5 accent-[#30598f]"
																type="checkbox"
																id={`rehearsal-${event.id}`}
																value={event.id}
																on:change={(e) => handleCheckboxChange(e, event.id ?? 0, 'concert')}
															/>
														</td>
														<td
															class="px-6 py-3 font-medium dark:text-white border-t-2 border-b-2 border-gray-300"
															><DateShow
																startTime={event.startDate}
																endTime={event.endDate}
																withTime={false}
															></DateShow></td
														>
														<td
															class="px-6 py-3 font-medium dark:text-white border-t-2 border-b-2 border-gray-300"
															><DateShow
																startTime={event.startDate}
																endTime={event.endDate}
																withTime={true}
																withDate={false}
															></DateShow></td
														>
														<td
															class="px-6 py-3 font-medium dark:text-white border-t-2 border-b-2 border-gray-300"
															>{event.place}</td
														>
														<td class="px-6 py-3 border-t-2 border-b-2 border-gray-300">
															{#if event.type === 'concert'}
																<div class="eventTypeConcert">{event.type}</div>
															{/if}
															{#if event.type === 'rehearsal'}
																<div class="eventTypeRehearsal">{event.type}</div>
															{/if}
														</td>
														<td
															class="px-6 py-3 font-medium dark:text-white border-t-2 border-b-2 border-gray-300"
															>{event.comment ? event.comment : 'No additionnal information'}</td
														>
														<td
															class="px-6 py-3 font-medium dark:text-white border-t-2 border-b-2 border-r-2 border-gray-300 rounded-r-md"
														>
															<input
																id={`comment-concert-${event.id}`}
																class="bg-[#ebebeb] p-1 pl-2 pr-8 rounded"
																type="text"
																placeholder="Write your comment..."
																on:input={(e) => handleTextInput(e, event.id ?? 0, 'concert')}
															/>
														</td>
													</tr>
												{/each}
											{:else}
												<tr>
													<td class="px-6 py-4" colspan="3">No concert found</td>
												</tr>
											{/if}
										</tbody>
									</table>
								{/if}
								{#if isMobile}
									{#if combinedEvents.length > 0}
										{#each combinedEvents as event}
											<div
												class=" bg-white border-[2px] border-[#989898] pl-[10px] m-[15px] p-[5px] rounded-[12px] text-xs relative flex flex-col"
											>
												<div class="flex items-center">
													<input
														class="w-5 h-5 accent-[#30598f] ml-2 mr-2"
														type="checkbox"
														id={`${event.type}-${event.id}`}
														value={event.id}
														on:change={(e) => handleCheckboxChange(e, event.id ?? 0, (event.type === 'concert' ? 'concert' : 'rehearsal'))}
													/>
													<div class="w-[80%]">
														<div class="flex flex-col">
															<div class=" flex items-center gap-2 ml-2 p-[2px]">
																<Fa icon={faCalendar} class="text-[14px]" style="color: #6B9AD9;" />
																<DateShow
																	startTime={event.startDate}
																	endTime={event.endDate}
																	withTime={false}
																	isRehearsal={event.type === 'rehearsal'}
																/>
																<DateShow
																	startTime={event.startDate}
																	endTime={event.endDate}
																	withTime={true}
																	withDate={false}
																	isRehearsal={event.type === 'rehearsal'}
																/>
															</div>
															<div class=" flex items-center gap-2 ml-2 p-[2px]">
																<Fa icon={faLocationDot} class="text-[14px]" style="color: #6B9AD9;" />
																{event.place}
															</div>
															<div class=" flex items-center gap-2 ml-2 w-[70%]">
																<div
																	class="bg-gray-200 flex items-center gap-1 m-1 p-1 rounded-md pl-2 pr-2"
																>
																	<p class="text-gray-600">
																		<span class="text-black font-bold">Information :</span>
																		{event.comment ? event.comment : 'No additionnal information'}
																	</p>
																</div>
															</div>
														
															{#if event.type === 'rehearsal'}
																<div
																	class="absolute font-semibold bottom-[-0.5px] right-[-0.5px] bg-[#6B9AD9] text-white p-2 rounded-tl-2xl rounded-br-[10px]"
																>
																	{event.type}
																</div>
															{:else}
																<div
																	class="absolute font-semibold bottom-[-0.5px] right-[-0.5px] bg-[#a584d2] text-white p-2 rounded-tl-2xl rounded-br-[10px]"
																>
																	{event.type}
																</div>
															{/if}
														</div>
													</div>
												</div>
												{#if newContact.concerts.some((c) => c.id === event.id) || newContact.rehearsals.some((r) => r.id === event.id)}
													<div class='w-[50%] ml-[-6px] text-[11px]'>
													{#if newContact.concerts.find((c) => c.id === event.id)?.comment == '' || newContact.rehearsals.find((r) => r.id === event.id)?.comment == ''}
													<button class="bg-blue-500" on:click={() => showCommentPopUp(event.id ?? 0,(event.type === 'concert' ? 'concert' : 'rehearsal') )}>
														Add a comment
													</button>
													{:else}
													<button class="bg-blue-500" on:click={() => showCommentPopUp(event.id ?? 0,(event.type === 'concert' ? 'concert' : 'rehearsal') )}>
														Edit comment
													</button>
													{/if}
													</div>
												{/if}
											</div>
										{/each}
									{:else}
										<tr
											><td class="px-6 py-4 border border-gray-300" colspan="5">No events found</td
											></tr
										>
									{/if}
								{/if}
							</div>

							{#if registration.form && registration.form.length > 0}
								<div class="mt-10 ml-6">
									<h3 class="text-xl font-bold tracking-tight text-gray-500 dark:text-white mb-6">
										Additional informations
									</h3>
									<div class="border-2 border-gray-400 rounded-xl p-1 ml-5 mr-8 bg-white">
										{#each newContact.answers as answer}
											<RegistrationForm
												bind:answer
												bind:forms={registration.form}
												disabled={false}
											/>
										{/each}
									</div>
								</div>
							{/if}
						</div>
						<div class="form-body-buttons">
							<div class="bg-white w-full flex justify-center">
								<button class="bg-blue-500" on:click={() => (step = step - 1)}> Back </button>
								<button class="bg-blue-500" on:click={handleSubmit}> Submit </button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Image fixe en haut */
	.fixed-background {
		position: fixed;
		top: 0px;
		left: 0;
		width: 100vw;
		height: 35vh;
		overflow: hidden;
		z-index: -1;
	}
	.fixed-background img {
		top: 0px;
		width: 100%;
		height: 100%;
		object-fit: cover;
		overflow-x: hidden;
	}
	.overlay-filter {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 35vh;
		background: linear-gradient(
			to bottom,
			#6bb0c7db,
			/* couleur en haut */ #343cade1 /* couleur en bas */
		);
		display: flex;
		justify-content: center; /* centre horizontalement */
		align-items: center; /* centre verticalement */
		text-align: center; /* pour le texte */
		padding: 0 20px; /* optionnel : un peu de marge sur les côtés */
		pointer-events: none;
		overflow-x: hidden;
	}
	.registration-title {
		margin-left: 30px;
		margin-right: 30px;
		margin-top: 5vh;
		margin-bottom: 6vh;
		display: flex;
		justify-content: center;
		align-items: center;
		color: white;
		font-size: 3rem;
	}
	.registration-content {
		border-radius: 10px;
		margin-left: 10vw;
		margin-right: 10vw;
		margin-bottom: 5vh;
		height: 72vh;
		background-color: white;
		box-shadow: 0 2px 20px rgba(0, 0, 0, 0.382);
		overflow: hidden;
	}
	.from-body {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		height: 75%;
	}
	.form-body-buttons {
		display: flex;
		box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.3);
		justify-content: center;
	}
	.from-body button {
		height: 35px;
		border-radius: 7px;
		width: 100%;
		margin: 1%;
		margin-left: 7%;
		margin-right: 7%;
		background-color: #7dbbe4;
		color: white;
		font-weight: bold;
		font-size: larger;
	}
	.form-body-content {
		background-color: #ececec;
		width: 100%;
		height: 100%;
		overflow-y: auto;
	}
	.registration-bloc {
		width: 100vw;
		display: flex;
		justify-content: center;
	}
	.form-head {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 18vh;
		width: 100%;
	}
	.tabs {
		justify-content: center;
		align-items: center;
		margin-top: 15px;
		width: 100%;
		height: 70%;
		pointer-events: none;
		font-size: small;
	}
	.tabs-details {
		width: 100%;
		display: flex;
		padding-left: 5vw;
		gap: 5vw;
		bottom: 0;
		font-size: larger;
		font-weight: bold;
		color: #929292;
	}
	.tabs-details button {
		position: relative;
		bottom: 0;
		justify-content: end;
	}
	.tabs-details button.active {
		color: #7dbbe4;
		border-bottom: 3px solid #7dbbe4; /* ligne globale si besoin */
		padding-bottom: 7px;
		bottom: 0px;
	}
	.eventTypeRehearsal {
		background-color: #6b9ad9;
		border-radius: 5px;
		color: white;
		font-weight: 500;
		text-align: center;
		vertical-align: middle;
		padding-left: 15px;
		padding-right: 15px;
		padding-bottom: 2px;
		width: fit-content;
	}
	.eventTypeConcert {
		background-color: #a584d2;
		border-radius: 5px;
		color: white;
		font-weight: 500;
		text-align: center;
		vertical-align: middle;
		padding-left: 15px;
		padding-right: 15px;
		padding-bottom: 2px;
		width: fit-content;
	}
	.content-contact {
		padding-left: 30%;
		padding-right: 30%;
		font-size: medium;
	}
	@media (max-width: 700px) {
		/* Cible les écrans mobiles et tablettes */
		.registration-title {
			margin-left: 30px;
			margin-right: 30px;
			margin-top: 20px;
			margin-bottom: 20px;
			display: flex;
			justify-content: center;
			align-items: center;
			color: white;
			font-size: 2rem;
		}
		/* Image fixe en haut */
		.fixed-background {
			position: fixed;
			top: 0px;
			left: 0;
			width: 100vw;
			height: 35vh;
			overflow: hidden;
			z-index: -1;
		}
		.fixed-background img {
			top: 0px;
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
		.overlay-filter {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 35vh;
			background: linear-gradient(
				to bottom,
				#6bb0c7db,
				/* couleur en haut */ #343cade1 /* couleur en bas */
			);
			display: flex;
			justify-content: center; /* centre horizontalement */
			align-items: center; /* centre verticalement */
			text-align: center; /* pour le texte */
			padding: 0 20px; /* optionnel : un peu de marge sur les côtés */
			pointer-events: none;
		}
		.tabs {
			justify-content: center;
			align-items: center;
			margin-top: 15px;
			width: 100%;
			height: 70%;
			pointer-events: none;
			font-size: x-small;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: clip;
		}
		.registration-content {
			border-radius: 10px;
			margin-left: 10vw;
			margin-right: 10vw;
			margin-bottom: 2px;
			background-color: white;
			box-shadow: 0 2px 20px rgba(0, 0, 0, 0.382);
			overflow: hidden;
		}
		.phoneEvent {
			background-color: white;
			border: 2px solid #989898;
			border-radius: 12px;
			padding-left: 50px;
			margin: 15px;
			padding: 5px;
		}
		.tabs-details {
			font-size: medium;
		}
		.content-contact {
			padding-left: 10%;
			padding-right: 10%;
			font-size: small;
		}
	}
</style>
