<script lang="ts">
	import type { Answer } from '$lib/types/Answer';
	import type { Registration } from '$lib/types/Registration';
	import RegistrationForm from './RegistrationForm.svelte';
	import DateShow from '../DateShow.svelte';

	export let registration: Registration;
	export let projectId: number;

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
            newContact.concerts = toggleSelection(newContact.concerts, id, inputElement.checked ? comment : '');
        } else {
            newContact.rehearsals = toggleSelection(newContact.rehearsals, id, inputElement.checked ? comment : '');
        }
    }

    function handleTextInput(event: Event, id: number, type: 'concert' | 'rehearsal') {
        const inputElement = event.target as HTMLInputElement;
        if (type === 'concert') {
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
		if (newContact.first_name === '' || newContact.last_name === '' || newContact.email === '') {
			return alert('Please enter every non optional information.');
		}

		if (newContact.section_id === 0) {
			return alert('Please select the section you want to belong to.');
		}

        if (newContact.rehearsals.length === 0) {
            return alert('Please select the rehearsals you will attend to (at least one required).');
        }

        if (newContact.concerts.length === 0) {
            return alert('Please select the concerts you will attend to (at least one required).');
        }

		let emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		let isValid = emailPattern.test(newContact.email);

		if (!isValid) {
			return alert('Please enter a valid email address.');
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
</script>

<div
	class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
>
	{#if registration}
		<div class="p-5">
			<div
				class="mb-5 font-bold tracking-tight text-gray-900 border-b-gray-200 shadow dark:text-white origin-center w-full flex justify-center"
			>
				<h1 class="text-3xl font-bold mb-2 p-3">
					Registration to the project : {registration.project?.name || 'No project name available'}
				</h1>
			</div>

			<div class="mb-8">
				<h2 class="text-2xl font-bold tracking-tight text-blue-900 dark:text-white underline mb-5">
					Project Informations
				</h2>
				<div class="mb-3 ml-5">
					<h3 class="text-xl font-bold tracking-tight text-blue-900 dark:text-white underline mb-5">
						Concerts
					</h3>

					<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
						<thead
							class="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400"
						>
							<tr>
								<th class="px-6 py-3">Date</th>
								<th class="px-6 py-3">Place</th>
								<th class="px-6 py-3">Comment</th>
							</tr>
						</thead>
						<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
							{#if registration.project?.concerts && registration.project.concerts.length > 0}
								{#each registration.project.concerts as concert}
									<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
										<th
											scope="row"
											class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
											><DateShow date={concert.date} withTime></DateShow></th
										>
										<td class="px-6 py-4">{concert.place}</td>
										<td class="px-6 py-4">{concert.comment}</td>
									</tr>
								{/each}
							{:else}
								<tr>
									<td class="px-6 py-4" colspan="3">No concert found</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>

				<div class="mb-3 ml-5">
					<h3 class="text-xl font-bold tracking-tight text-blue-900 dark:text-white underline mb-5">
						Rehearsals
					</h3>
					<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
						<thead
							class="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400"
						>
							<tr>
								<th class="px-6 py-3">Date</th>
								<th class="px-6 py-3">Place</th>
								<th class="px-6 py-3">Comment</th>
							</tr>
						</thead>
						<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
							{#if registration.project?.rehearsals}
								{#each registration.project.rehearsals as rehearsal}
									<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
										<th
											scope="row"
											class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
											><DateShow date={rehearsal.date} withTime></DateShow></th
										>
										<td class="px-6 py-4">{rehearsal.place}</td>
										<td class="px-6 py-4">{rehearsal.comment}</td>
									</tr>
								{/each}
							{:else}
								<tr>
									<td class="px-6 py-4" colspan="3">No rehearsal found</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>

				<div class="mb-3 ml-5">
					<h3 class="text-xl font-bold tracking-tight text-blue-900 dark:text-white underline mb-5">
						Program and scores
					</h3>
					<div class="w-full flex">
						<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
							<thead
								class="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400"
							>
								<tr>
									<th scope="col" class="px-6 py-3"> Composer </th>
									<th scope="col" class="px-6 py-3"> Name </th>
								</tr>
							</thead>
							<tbody>
								{#if registration.project?.pieces}
									{#each registration.project.pieces as piece}
										<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
											<td class="px-6 py-4">
												{piece.composer.shortName}
											</td>
											<th
												scope="row"
												class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
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
				{#if registration.contents && registration.contents.length > 0}
					{#each registration.contents as content}
						<div class="mb-8 ml-5">
							<h2
								class="text-2xl font-bold tracking-tight text-blue-900 dark:text-white underline mb-5"
							>
								{@html content.title}
							</h2>
							<div class="w-full flex ml-5">
								<p class="text-gray-800 dark:text-gray-400">{@html content.text}</p>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<div
			class="m-5 pt-5 relative max-w-xxl bg-white border border-blue-900 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
		>
			<div class="mb-8 ml-4">
				<h2 class="text-2xl font-bold tracking-tight text-blue-900 dark:text-white underline mb-5">
					Registration
				</h2>

				<div class="ml-6 mb-5">
					<h3 class="text-xl font-bold tracking-tight text-blue-900 dark:text-white underline mb-5">
						Contact info
					</h3>
					<div class="flex flex-col w-1/2">
						<div class="mb-2 text-gray-800 dark:text-gray-400">
							<span>First name:</span>
							<input
								class="p-1"
								bind:value={newContact.first_name}
								placeholder="First name"
								required
							/>
						</div>

						<div class="mb-2 text-gray-800 dark:text-gray-400">
							<span>Last name:</span>
							<input
								class="p-1"
								bind:value={newContact.last_name}
								placeholder="Last name"
								required
							/>
						</div>

						<div class="mb-2 text-gray-800 dark:text-gray-400">
							<span>Email adress:</span>
							<input
								class="p-1"
								bind:value={newContact.email}
								placeholder="johndoe@email.com"
								required
							/>
						</div>

						<div class="mb-2 text-gray-800 dark:text-gray-400">
							<span>Phone number (optional) :</span>
							<input class="p-1" bind:value={newContact.phone} placeholder="Phone number" />
						</div>

						<div class="mb-2 text-gray-800 dark:text-gray-400">
							<span>Messenger (optional):</span>
							<input
								class="p-1"
								bind:value={newContact.messenger}
								placeholder="Messenger username"
							/>
						</div>
					</div>
				</div>

				<div class="ml-6 mb-5">
					<h3 class="text-xl font-bold tracking-tight text-blue-900 dark:text-white underline mb-2">
						Section
					</h3>
					{#if registration.project?.sectionGroup?.sections}
						<p>Select your section :</p>
						<select bind:value={newContact.section_id}>
							{#each registration.project.sectionGroup.sections as section}
								<option value={section.id}>{section.name}</option>
							{/each}
						</select>
					{/if}
				</div>

				<div class="ml-6 mr-4">
					<h3 class="text-xl font-bold tracking-tight text-blue-900 dark:text-white underline mb-2">
						Concert attendance
					</h3>
					<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
						<thead
							class="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400"
						>
							<tr>
								<th class="px-6 py-3">Select</th>
								<th class="px-6 py-3">Date</th>
								<th class="px-6 py-3">Place</th>
								<th class="px-6 py-3">Comment</th>
							</tr>
						</thead>
						<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
							{#if registration.project?.concerts}
								{#each registration.project.concerts as concert}
									<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
										<td>
											<input
												type="checkbox"
												id={`rehearsal-${concert.id}`}
												value={concert.id}
												on:change={(e) => handleCheckboxChange(e, concert.id, 'concert')}
											/>
										</td>
										<td
											class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
											><DateShow date={concert.date} withTime></DateShow></td
										>
										<td class="px-6 py-4">{concert.place}</td>
										<td class="px-6 py-4">
											<input
												id={`comment-concert-${concert.id}`}
												class="border-solid border-2 border-gray-500 p-1"
												type="text"
												placeholder="Comment"
												on:input={(e) => handleTextInput(e, concert.id, 'concert')}
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
				</div>

				<div class="ml-6 mr-4">
					<h3 class="text-xl font-bold tracking-tight text-blue-900 dark:text-white underline mb-2">
						Rehearsal attendance
					</h3>
					<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
						<thead
							class="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400"
						>
							<tr>
								<th class="px-6 py-3">Select</th>
								<th class="px-6 py-3">Date</th>
								<th class="px-6 py-3">Place</th>
								<th class="px-6 py-3">Comment</th>
							</tr>
						</thead>
						<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
							{#if registration.project?.rehearsals}
								{#each registration.project.rehearsals as rehearsal}
									<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
										<td>
											<input
												type="checkbox"
												id={`rehearsal-${rehearsal.id}`}
												value={rehearsal.id}
												on:change={(e) => handleCheckboxChange(e, rehearsal.id, 'rehearsal')}
											/>
										</td>
										<td
											class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
											><DateShow date={rehearsal.date} withTime></DateShow></td
										>
										<td class="px-6 py-4">{rehearsal.place}</td>
										<td class="px-6 py-4">
											<input
												id={`comment-rehearsal-${rehearsal.id}`}
												class="border-solid border-2 border-gray-500 p-1"
												type="text"
												placeholder="Comment"
												on:input={(e) => handleTextInput(e, rehearsal.id, 'rehearsal')}
											/>
										</td>
									</tr>
								{/each}
							{:else}
								<tr>
									<td class="px-6 py-4" colspan="3">No rehearsal found</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>

				{#if registration.form && registration.form.length > 0}
					<div class="mt-6 ml-6">
						<h3
							class="text-xl font-bold tracking-tight text-blue-900 dark:text-white underline mb-2"
						>
							Additional informations
						</h3>
						{#each newContact.answers as answer}
							<RegistrationForm bind:answer bind:forms={registration.form} disabled={false} />
						{/each}
					</div>
				{/if}

				<div class="mt-10 w-full">
					<button
						class="text-white bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2
					ml-10"
						on:click={handleSubmit}
					>
						Submit
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
