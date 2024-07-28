<script lang="ts">
	import type { Participant } from '$lib/types/Participant';
	import type { Project } from '$lib/types/Project';

	export let participantsWithoutEmail: Array<Participant>;
	export let participantsNotValidated: Array<Participant>;
	export let project: Project;
</script>

<div class="w-full p-1">
	<h3 class="text-lg uppercase">Important informations</h3>
	<div
		class="w-full bg-white border border-red-600 shadow dark:bg-gray-800 dark:border-gray-700 flex flex-wrap"
	>
		{#if participantsWithoutEmail.length !== 0}
			<div class="m-1 p-1 border rounded lg:max-w-1/3">
				<h3 class="uppercase">Participants without email:</h3>
				<ul>
					{#each participantsWithoutEmail as participant}
						<li class="text-sm">
							<a href="/projects/{project.id}/management/participants/{participant.id}">
								{participant.contact.firstName}
								{participant.contact.lastName}
								(Participant profile)
							</a>
							<a href="/contacts/{participant.contact.id}">(Profile)</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
		{#if !project.responsibles || project.responsibles.length === 0}
			<div class="m-1 p-1 border rounded lg:max-w-lg">
				<h3 class="uppercase">No responsible</h3>
				<p>
					Please add at least one person to be in charge of the project. This person will have its
					contact informations displayed for this project.
					<a href="/projects/{project.id}/management/modify">(Add responsible person)</a>
				</p>
			</div>
		{/if}
		{#if project.rehearsals.length === 0}
			<div class="m-1 p-1 border rounded lg:max-w-lg">
				<h3 class="uppercase">No rehearsal</h3>
				<p>
					Please add at least one rehearsal to the project. This will allow participants to know
					when they have to be present.
					<a href="/projects/{project.id}/management/modify">(Add rehearsal)</a>
				</p>
			</div>
		{/if}
		{#if project.concerts.length === 0}
			<div class="m-1 p-1 border rounded lg:max-w-lg">
				<h3 class="uppercase">No concert</h3>
				<p>
					Please add at least one concert to the project. This will allow participants to know when
					they have to be present.
					<a href="/projects/{project.id}/management/modify">(Add concert)</a>
				</p>
			</div>
		{/if}
		{#if project.sectionGroup?.sections.length === 0}
			<div class="m-1 p-1 border rounded lg:max-w-lg">
				<h3 class="uppercase">No section in chosen section group</h3>
				<p>
					Please add at least one section to the section group. This will allow participants to know
					in which section they are.
					<a href="/sectionGroups">(Add section)</a>
				</p>
			</div>
		{/if}
		{#if !project.callsheets || project.callsheets?.length === 0}
			<div class="m-1 p-1 border rounded lg:max-w-lg">
				<h3 class="uppercase">No callsheet</h3>
				<p>
					Please add at least one callsheet to the project. This will allow participants to have
					informations about this project when needed.
					<a href="/projects/{project.id}/management/callsheets">(Add callsheet)</a>
				</p>
			</div>
		{/if}
		{#if !project.registration}
			<div class="m-1 p-1 border rounded lg:max-w-lg">
				<h3 class="uppercase">No registration</h3>
				<p>
					Please add a registration to the project. With this you will allow people to register to
					this project if they have the link.
					<a href="/projects/{project.id}/management/registration">(Add registration)</a>
				</p>
			</div>
		{/if}

		{#if participantsNotValidated.length > 0}
			<div class="m-1 p-1 border rounded lg:max-w-lg">
				<h3 class="uppercase">Validate registrations :</h3>
				<ul>
					{#each participantsNotValidated.slice(0, 3) as participant}
						<li class="text-sm">
							<a href="/projects/{project.id}/management/participants/{participant.id}">
								{participant.contact.firstName}
								{participant.contact.lastName}
							</a>
						</li>
					{/each}
					<li>...</li>
				</ul>
			</div>
		{/if}
	</div>
</div>
