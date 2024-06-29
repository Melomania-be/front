<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	type Project = {
		id: number;
		name: string;
		section_group_id: number | null;
		registration_id: number;
		rehearsals: Rehearsal[];
		pieces: Piece[];
		sectionGroup: SectionGroup;
	};

	type SectionGroup = {
		id: number;
		name: string;
		sections: Section[];
	};

	type Section = {
		id: number;
		name: string;
		size: number;
	};

	type ContentRegistration = {
		id: number;
		title: string;
		text: string;
		registration_id: number;
	};

	type Form = {
		id: number;
		text: string;
		type: string;
		registration_id: number;
	};

	type Answer = {
		text: string | boolean;
		form_id: number;
	};

	type Registration = {
		id: number;
		project: Project | null;
		contents: ContentRegistration[];
		forms: Form[];
		//status: boolean
	};

	type Rehearsal = {
		id: number;
		date: string;
		comment: string;
		place: string;
	};

	type Piece = {
		id: number;
		name: string;
		opus: string;
		year_of_composition: string;
		arranger: string | null;
	};

	type SubmittedContact = {
		first_name: string;
		last_name: string;
		email: string;
		phone: string | null;
		messenger: string | null;
		validated_contact: boolean;
		section_id: number;
		answers: Answer[];
	};

	let registration: Registration;
	let registrationId: number;

	let selectedRehearsals: Set<number> = new Set();

	let value: string | boolean;

	let newContact: SubmittedContact = {
		first_name: '',
		last_name: '',
		email: '',
		phone: '',
		messenger: '',
		validated_contact: false,
		section_id: 0,
		answers: []
	};

	function handleSelection(id: number) {
		if (selectedRehearsals.has(id)) {
			selectedRehearsals.delete(id);
		} else {
			selectedRehearsals.add(id);
		}
	}

	function handleAnswers(formId: number, value: string | boolean) {
		const existingAnswerIndex = newContact.answers.findIndex((answer) => answer.form_id === formId);

		if (existingAnswerIndex !== -1) {
			newContact.answers[existingAnswerIndex].text = value;
		} else {
			newContact.answers.push({
				text: value,
				form_id: formId
			});
		}

		console.log(newContact.answers);
	}

	async function handleSubmit() {
		if (newContact.first_name === '' || newContact.last_name === '' || newContact.email === '') {
			return alert('Please enter every non optional information.');
		}

		if (newContact.section_id === 0) {
			return alert('Please select the section you want to belong to.');
		}

		if (selectedRehearsals.size === 0) {
			return alert('Please select the rehearsals you will attend to (at least one required).');
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
			rehearsals: Array.from(selectedRehearsals),
			project_id: registration.project?.id,
			section_id: newContact.section_id,
			answers: newContact.answers
		};

		const response = await fetch(`/api/registrations/${registrationId}`, {
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
			window.location.reload();
		}
	}

	onMount(async () => {
		console.log($page.params);
		registrationId = parseInt($page.params.id);

		const registrationResponse = await fetch(`/api/registrations/${registrationId}`, {
			method: 'GET'
		});

		if (registrationResponse.status === 200) {
			const data = await registrationResponse.json();

			console.log(data);

			registration = {
				id: data.id,
				project: data.project,
				contents: data.content,
				forms: data.form
			};

			console.log(registration);
		} else {
			console.error('Failed to fetch registration');
		}
	});
</script>

{#if registration}
	<div class="flex flex-col w-1/2 border-2 border-rose-500">
		<h1>Project Informations</h1>
		<br />

		<p>Project Name: {registration.project?.name || 'No project name available'}</p>
		<div>
			<h3>Rehearsals</h3>
			{#if registration.project?.rehearsals}
				<table>
					<thead>
						<tr>
							<th>Date</th>
							<th>Place</th>
							<th>Comment</th>
						</tr>
					</thead>
					<tbody>
						{#each registration.project.rehearsals as rehearsal}
							<tr>
								<td>{rehearsal.date}</td>
								<td>{rehearsal.place}</td>
								<td>{rehearsal.comment}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<p>No rehearsal information available</p>
			{/if}
		</div>
		<div>
			<h3>Pieces</h3>
			{#if registration.project?.pieces}
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Opus</th>
							<th>Year of Composition</th>
							<th>Arranger</th>
						</tr>
					</thead>
					<tbody>
						{#each registration.project.pieces as piece}
							<tr>
								<td>{piece.name}</td>
								<td>{piece.opus}</td>
								<td>{piece.year_of_composition}</td>
								<td>{piece.arranger || 'N/A'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<p>No pieces found for this project</p>
			{/if}
		</div>

		{#if registration.contents}
			<div>
				<h3>Content Registration</h3>
				{#each registration.contents as content}
					<div>
						<h4>{content.title}</h4>
						<p>{content.text}</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="flex flex-col w-1/2 border-2 border-rose-500">
		<h2>Inscription</h2>
		<h3>General informations</h3>
		<div class="flex flex-col p-2">
			<span>First name:</span>
			<input class="p-1" bind:value={newContact.first_name} placeholder="First name" required />

			<span>Last name:</span>
			<input class="p-1" bind:value={newContact.last_name} placeholder="Last name" required />

			<span>Email adress:</span>
			<input class="p-1" bind:value={newContact.email} placeholder="johndoe@email.com" required />

			<span>Phone number (optional) :</span>
			<input class="p-1" bind:value={newContact.phone} placeholder="Phone number" />

			<span>Messenger (optional):</span>
			<input class="p-1" bind:value={newContact.messenger} placeholder="Messenger username" />

			{#if registration.project?.sectionGroup.sections}
				<h3>Section</h3>
				<p>Select the section you belong to :</p>
				<select bind:value={newContact.section_id}>
					{#each registration.project.sectionGroup.sections as section}
						<option value={section.id}>{section.name}</option>
					{/each}
				</select>
			{/if}

			<h3>Inscription to rehearsals</h3>
			{#if registration && registration.project?.rehearsals}
				<table>
					<thead>
						<tr>
							<th>Select</th>
							<th>Date</th>
							<th>Place</th>
						</tr>
					</thead>
					<tbody>
						{#each registration.project.rehearsals as rehearsal}
							<tr>
								<td>
									<input
										type="checkbox"
										id={`rehearsal-${rehearsal.id}`}
										value={rehearsal.id}
										on:change={() => handleSelection(rehearsal.id)}
									/>
								</td>
								<td>
									{rehearsal.date}
								</td>
								<td>
									{rehearsal.place}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<p>No rehearsal planned yet</p>
			{/if}

			{#if registration.forms}
				<h3>Additional informations :</h3>
				{#each registration.forms as form}
					{form.text}
					{#if form.type === 'text'}
						<input
							class="p-1"
							bind:value
							placeholder="Enter text"
							on:change={(event) => handleAnswers(form.id, value)}
						/>
					{:else if form.type === 'checkbox'}
						<label class="flex items-center">
							<input
								class="p-1"
								type="checkbox"
								on:change={(event) => handleAnswers(form.id, event)}
							/>
							<span class="ml-2"> Check for "YES"</span>
						</label>
					{:else}
						Error on type of form
					{/if}
				{/each}
			{/if}
			<button class="p-1 border-2" on:click={handleSubmit}>Submit</button>
		</div>
	</div>
{:else}
	<p>No project information available</p>
{/if}
