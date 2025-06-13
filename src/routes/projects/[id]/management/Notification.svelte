<script lang="ts">
	import type { Participant } from '$lib/types/Participant';
	import type { Project } from '$lib/types/Project';

	export let participantsWithoutEmail: Array<Participant>;
	export let participantsNotValidated: Array<Participant>;
	export let project: Project;

	let managerDetails = false;
	let rehearsalDetails = false;
	let concertDetails = false;
	let sectionGroupDetails = false;
	let callsheetDetails = false;
	let registrationDetails = false;

	let informationDisplayed : boolean = (
		(!project.responsibles || project.responsibles.length === 0)
		|| project.rehearsals.length === 0
		|| project.concerts.length === 0
		|| project.sectionGroup?.sections.length === 0
		|| (!project.callsheets || project.callsheets?.length === 0 )
		|| !project.registration
	);
</script>

<div class="p-2 pl-4 pr-4">
	<h3 class="text-lg font-bold text-[#E35656] uppercase">Information</h3>
	<div
		class="p-3 pl-8 w-full flex flex-wrap gap-2 justify-center"
	>
	<!--
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
		-->
		{#if informationDisplayed}
			{#if !project.responsibles || project.responsibles.length === 0}
				<a class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
					href="/projects/{project.id}/management/modify"
					on:mouseenter={() => managerDetails = true}
					on:mouseleave={() => managerDetails = false}
					>
					<span>No Manager</span>
					<div class="tooltip font-s pointer-events-none {managerDetails ? 'visible' : ''}">
						Please add at least one person to be in charge of the project. This person will have its
						contact informations displayed for this project.
					</div>
				</a>
			{/if}
			{#if project.rehearsals.length === 0}
				<a class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
					href="/projects/{project.id}/management/modify"
					on:mouseenter={() => rehearsalDetails = true}
					on:mouseleave={() => rehearsalDetails = false}
					>
					<span>No Rehearsal</span>
					<div class="tooltip font-s pointer-events-none {rehearsalDetails ? 'visible' : ''}">
						Please add at least one rehearsal to the project. This will allow participants to know
						when they have to be present.
					</div>
				</a>
			{/if}
			{#if project.concerts.length === 0}
				<a class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
					href="/projects/{project.id}/management/modify"
					on:mouseenter={() => concertDetails = true}
					on:mouseleave={() => concertDetails = false}
					>
					<span>No Concert</span>
					<div class="tooltip font-s pointer-events-none {concertDetails ? 'visible' : ''}">
						Please add at least one concert to the project. This will allow participants to know when
						they have to be present.
					</div>
				</a>
			{/if}
			{#if project.sectionGroup?.sections.length === 0}
				<a class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
					href="/sectionGroups"
					on:mouseenter={() => sectionGroupDetails = true}
					on:mouseleave={() => sectionGroupDetails = false}
					>
					<span>No Section</span>
					<div class="tooltip font-s pointer-events-none {sectionGroupDetails ? 'visible' : ''}">
						Please add at least one section to the section group. This will allow participants to know
						in which section they are.
					</div>
				</a>
			{/if}
			{#if !project.callsheets || project.callsheets?.length === 0}
				<a class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
					href="/projects/{project.id}/management/callsheets"
					on:mouseenter={() => callsheetDetails = true}
					on:mouseleave={() => callsheetDetails = false}
					>
					<span>No Callsheet</span>
					<div class="tooltip font-s pointer-events-none {callsheetDetails ? 'visible' : ''}">
						Please add at least one callsheet to the project. This will allow participants to have
						informations about this project when needed.
					</div>
				</a>
			{/if}
			{#if !project.registration}
				<a class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
					href="/projects/{project.id}/management/registration"
					on:mouseenter={() => registrationDetails = true}
					on:mouseleave={() => registrationDetails = false}
					>
					<span>No Registration</span>
					<div class="tooltip font-s pointer-events-none {registrationDetails ? 'visible' : ''}">
						Please add a registration to the project. With this you will allow people to register to
						this project if they have the link.
					</div>
				</a>
			{/if}
		{:else}
			<p class="mb-4 text-gray-500 uppercase">No information</p>
		{/if}
		<!--
		{#if participantsNotValidated.length > 0}
			<div class="m-1 p-1 border rounded lg:max-w-lg">
				<h3 class="uppercase">Validate registrations :</h3>
				<ul>
					{#each participantsNotValidated.slice(0, 3) as participant}
						<li class="text-sm">
							<a href="/projects/{project.id}/management/validation">
								{participant.contact.firstName}
								{participant.contact.lastName}
							</a>
						</li>
					{/each}
					<li>...</li>
				</ul>
			</div>
		{/if}
		-->
	</div>
</div>


<style>
  .tooltip-wrapper {
    position: relative;
    display: inline-block;
    cursor: pointer;
	overflow: visible;
  }

  .tooltip {
    position: absolute;
    top: 100%; /* au-dessus de l'élément */
	margin-top: 0.5rem;
  	left: 50%;
  	transform: translateX(-50%);
	width: 30vw;
    background-color: #ffffff;
    color: #595959;
	font-weight: 400;
    padding: 0.4rem 0.6rem;
    border-radius: 5px;
	border: 2px solid #595959;
    font-size: 0.8rem;
    white-space: normal;
	word-wrap: break-word;
    z-index: 500;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .tooltip::before {
	content: '';
	position: absolute;
	top: -14px;
	left: 50%;
	transform: translateX(-50%);
	border-width: 7px;
	border-style: solid;
	border-color: transparent transparent #595959 transparent;
	}

  .tooltip.visible {
    opacity: 1;
  }
</style>