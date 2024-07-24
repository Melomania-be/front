<script lang="ts">
	import type { Answer } from '$lib/types/Answer';
	import type { Registration } from '$lib/types/Registration';
	import RegistrationForm from './RegistrationForm.svelte';

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
			: []
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

	let selectedRehearsals: Set<number> = new Set();

	function handleSelection(id: number | null) {
		if (!id) return;

		if (selectedRehearsals.has(id)) {
			selectedRehearsals.delete(id);
		} else {
			selectedRehearsals.add(id);
		}
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
			window.location.reload();
		}
	}
</script>

<div>
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
									<td>{piece.yearOfComposition}</td>
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
					<p><b>Contents</b></p>
					{#if registration.contents.length === 0}
						<p>No content found</p>
					{:else}
						{#each registration.contents as content}
							<div>
								<p class="uppercase">{content.title}</p>
								<p>{@html content.text}</p>
							</div>
						{/each}
					{/if}
				</div>
			{/if}
		</div>

		<div class="flex flex-col w-1/2 border-2 border-rose-500">
			<h2>Registration</h2>
			<h3>Contact info</h3>
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

				{#if registration.project?.sectionGroup?.sections}
					<h3>Section</h3>
					<p>Select your section :</p>
					<select bind:value={newContact.section_id}>
						{#each registration.project.sectionGroup.sections as section}
							<option value={section.id}>{section.name}</option>
						{/each}
					</select>
				{/if}

				<h3>Rehearsal attendance</h3>
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

				{#if registration.form}
					<h3>Additional informations :</h3>
					{#each newContact.answers as answer}
						<RegistrationForm bind:answer bind:forms={registration.form} disabled={false} />
					{/each}
				{/if}
				<button class="p-1 border-2" on:click={handleSubmit}>Submit</button>
			</div>
		</div>
	{:else}
		<p>No project information available</p>
	{/if}
</div>
