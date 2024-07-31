<script lang="ts">
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import type { Recommended } from '$lib/types/Recommended';
	import type { Instrument } from '$lib/types/Instrument';
	import { onMount } from 'svelte';
	import Swal from 'sweetalert2';
	import { page } from '$app/stores';

	import Fa from 'svelte-fa';
	import { faPhone, faEnvelope, faCircleUser, faComment } from '@fortawesome/free-solid-svg-icons';

	let instruments: Array<Instrument>;
	let addInstrument: Instrument = {
		id: null,
		name: '',
		family: '',
		createdAt: null,
		updatedAt: null,
		pivot_proficiency_level: ''
	};

	let recommended: Recommended = {
		id: null,
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		messenger: '',
		instruments: [],
		comment: '',
		project_id: null,
		createdAt: null,
		updatedAt: null
	};

	let mode = 'create';
	let allowModification = mode === 'modify' ? false : true;

	onMount(async () => {
		let response = await fetch('/api/instruments', {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			instruments = await response.json();
		});
	});

	async function errorEvent(response: Response) {
		if (response.status >= 400 && response.status < 500) {
			const jsonResponse = await response.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		} else if (response.status >= 500) {
			alert('Server error');
		}
	}

	async function PopupAddRecommended() {
		if (recommended.firstName && recommended.lastName) {
			Swal.fire({
				title: 'Are you sure?',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Recommende it!'
			}).then((result) => {
				if (result.isConfirmed) {
					addRecommended();
					Swal.fire({
						title: 'Recommended!',
						text: 'The profil has been Recommended.',
						icon: 'success'
					});
				}
			});
		}
	}

	async function addRecommended() {
		const data = {
			first_name: recommended.firstName,
			last_name: recommended.lastName,
			email: recommended.email,
			phone: recommended.phone,
			messager: recommended.messenger,
			instruments: recommended.instruments,
			comment: recommended.comment,
			project_id: Number($page.params.id),
			createdAt: (await new Date(recommended.createdAt))?.getTime(),
			updatedAt: (await new Date(recommended.updatedAt))?.getTime()
		};
		console.log(data)

		const response = await fetch('/api/recommended/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});

		errorEvent(response);

		if (response.ok) {
			window.location.reload();
		}
	}
</script>

<form class="w-[40rem] mx-auto p-4">
	<div class="block mb-2 text-sm font-bold text-gray-900 dark:text-white">Recommandation :</div>

	<div class="grid md:grid-cols-2 md:gap-6">
		<div class="max-w-sm mx-auto">
			<label for="firstName" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
				>*First name</label
			>
			<div class="flex">
				<span
					class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-e-0 border-gray-300 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600"
				>
					<Fa icon={faCircleUser} />
				</span>
				<input
					type="text"
					id="firstName"
					class="rounded-none rounded-e-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
					bind:value={recommended.firstName}
					placeholder="Bonnie"
					required
				/>
			</div>
		</div>

		<div class="max-w-sm mx-auto">
			<label for="lastName" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
				>*Last name</label
			>
			<div class="flex">
				<input
					type="text"
					id="lastName"
					class="rounded-none rounded-e-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
					bind:value={recommended.lastName}
					placeholder="Green"
					required
				/>
			</div>
		</div>
	</div>

	<div class="max-w-md mx-auto p-4">
		<label for="Email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
			>Email</label
		>
		<div class="flex">
			<span
				class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-e-0 border-gray-300 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600"
			>
				<Fa icon={faEnvelope} />
			</span>
			<input
				type="text"
				id="Email"
				class="rounded-none rounded-e-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
				bind:value={recommended.email}
				placeholder="Bonnie.Green@company.com"
			/>
		</div>
	</div>

	<div class="max-w-md mx-auto p-4">
		<label for="Phone-number" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
			>Phone number</label
		>
		<div class="flex">
			<span
				class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-e-0 border-gray-300 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600"
			>
				<Fa icon={faPhone} />
			</span>
			<input
				type="tel"
				id="Phone-number"
				pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
				class="rounded-none rounded-e-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
				bind:value={recommended.phone}
				placeholder="Phone number (123-456-7890)"
			/>
		</div>
	</div>

	<div class="max-w-md mx-auto p-4">
		<label
			for="Messenger handle"
			class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Messenger handle</label
		>
		<div class="flex">
			<span
				class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-e-0 border-gray-300 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600"
			>
				<Fa icon={faComment} />
			</span>
			<input
				type="text"
				id="Messager"
				class="rounded-none rounded-e-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
				bind:value={recommended.messenger}
				placeholder="Messenger handle"
			/>
		</div>
	</div>

	<div>
		<div
			class="w-full mb-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
		>
			<div class="px-4 py-2 bg-white rounded-t-lg dark:bg-gray-800">
				<label for="comment" class="sr-only">Your comment</label>
				<textarea
					bind:value={recommended.comment}
					id="comment"
					rows="4"
					class="w-full px-0 text-sm text-gray-900 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-white dark:placeholder-gray-400"
					placeholder="Write a comment..."
				></textarea>
			</div>
		</div>
	</div>

	<!--ajout des instruments-->
	<div class="max-w-[40rem] mx-auto">
		<h3 class="w-full text-center m-1">Instruments</h3>

		<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border">
			<tbody>
				{#each recommended.instruments as instrument}
					<tr class="even:bg-slate-200">
						<th>
							{instrument.name}
						</th>
						<th>
							{instrument.family}
						</th>
						<th>
							{instrument.pivot_proficiency_level}
						</th>
						{#if allowModification}
							<th>
								<button
									on:click={() => {
										recommended.instruments.splice(recommended.instruments.indexOf(instrument), 1);
										allowModification = !allowModification;
										allowModification = !allowModification;
									}}
									class="text-blue-700 hover:text-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:text-blue-500 dark:hover:text-blue-600 dark:focus:ring-blue-800"
									>Delete</button
								>
							</th>
						{:else}
							<th></th>
						{/if}
					</tr>
				{/each}
				{#if allowModification}
					<tr class="bg-neutral-300">
						<th colspan="2">
							{#if instruments}
								<select bind:value={addInstrument}>
									<option value="none">none</option>
									{#each instruments as instrument}
										<option value={instrument}>{instrument.name}</option>
									{/each}
								</select>
							{/if}
						</th>
						<th>
							{addInstrument.family}
						</th>
						<th>
							<select bind:value={addInstrument.pivot_proficiency_level}>
								<option value="Amateur - low level">Amateur - low level</option>
								<option value="Amateur - medium">Amateur - medium</option>
								<option value="Amateur - high">Amateur - high</option>
								<option value="Student">Student</option>
								<option value="Professional">Professional</option>
								<option value="High level professional">High level professional</option>
								<input placeholder="level" bind:value={addInstrument.pivot_proficiency_level} />
							</select></th
						>
						<th>
							<button
								class="text-blue-700 hover:text-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:text-blue-500 dark:hover:text-blue-600 dark:focus:ring-blue-800"
								on:click={() => {
									recommended.instruments.push(addInstrument);
									allowModification = !allowModification;
									allowModification = !allowModification;
								}}>Add</button
							>
						</th>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<p class="ms-auto text-xs text-gray-500 dark:text-gray-400">*Required to add or edit.</p>

	<div class="flex justify-center">
		<button
			type="submit"
			class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
			on:click={() => PopupAddRecommended()}>Submit</button
		>
	</div>
</form>
