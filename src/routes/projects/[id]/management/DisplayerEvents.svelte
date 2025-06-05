<script lang="ts">
	import DateShow from '$lib/components/DateShow.svelte';
	import { comment } from 'postcss';
	import { faCalendar } from '@fortawesome/free-regular-svg-icons';
	import { faLocationDot , faCommentDots , faChevronDown , faChevronUp } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';

	export let project: any;

	const today = new Date();
	const todayIso = today.toISOString();

	let showComment = false;

	let eventList = [...project.rehearsals.map( (r : any) => ({ ...r, type: 'rehearsal' }) ), ...project.concerts.map( (r : any) => ({ ...r, type: 'concert' }) )].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

	let showAllEvent = false;

	$: eventsToDisplay = showAllEvent ? eventList : eventList.slice(0, 6)

	let commentMapRehearsal: Record<number, boolean> = {};
	let commentMapConcert: Record<number, boolean> = {};

	if(project){
	for(const e of project.rehearsals){
		commentMapRehearsal[e.id] = false;
	}
	for(const e of project.concerts){
		commentMapConcert[e.id] = false;
	}
	console.log(commentMapConcert);
	console.log(commentMapRehearsal);
	}

</script>

<div
	class="w-full h-full border-[#8C8C8C] rounded-[10px] border-2 bg-white dark:bg-gray-800 dark:border-gray-700"
>
	<div class="flex mt-4 ml-4 items-center">
		<h1 class="font-bold text-lg">EVENTS</h1>
		<div class="ml-auto mr-4">
			<a
				class="text-white font-bold text-sm bg-[#6B9AD9] p-2 rounded-[8px]"
				href="/projects/{project.id}/management/modify">Edit</a
			>
		</div>
	</div>
	<div class="w-full">
		<div class="p-4 rounded-lg dark:bg-gray-800 w-full">
			<ul class="flex flex-col gap-2">
				<!-- {#each project.rehearsals as rehearsal} -->
				<table class="border-separate border-spacing-y-2 m-2">
					<thead>
						<!--
									<tr>
										<th class="px-4 py-2 text-left"></th>
										<th class="px-4 py-2 text-left"></th>
										<th class="px-4 py-2 text-left"></th>
									</tr>
									-->
					</thead>
					<tbody>
						{#each eventsToDisplay as event}
							<tr class="text-xs">
								<td class="border-y-[1.5px] border-[#B6B6B6] border-l-[1.5px] rounded-l-2xl pl-4 w-[42%]
								{todayIso > event.startDate ? "bg-[#EDEDED]" : ""}">
									<div class="flex items-center gap-2">
										<Fa icon={faCalendar} class="text-[14px]" style="color: #6B9AD9;" />
										<div class="p-1">
											<p>
												<DateShow
													startTime={event.startDate}
													endTime={event.endDate}
													withTime={false}
													isRehearsal
												/>
											</p>
											<p>
												<DateShow
													startTime={event.startDate}
													endTime={event.endDate}
													withTime={true}
													withDate={false}
													isRehearsal
												/>
											</p>
										</div>
									</div>
								</td>
								<td class="break-words border-y-[1.5px] border-[#B6B6B6]
								{todayIso > event.startDate ? "bg-[#EDEDED]" : ""}">
									<div class="flex items-center gap-2">
										<Fa icon={faLocationDot} class="text-[14px]" style="color: #6B9AD9;" />
										<h3 class="text-gray-900 dark:text-white">
											{event.place}
										</h3>
									</div>
								</td>
								<td class="border-y-[1.5px] border-[#B6B6B6] pr-4 pl-4 pt-1
								{todayIso > event.startDate ? "bg-[#EDEDED]" : ""}">
									{#if event.comment}
									<button class="tooltip-wrapper"
									on:mouseenter={() =>
									{if(event.type === "rehearsal"){
										commentMapRehearsal[event.id] = true;
									}
									else{
										commentMapConcert[event.id] = true;
									}}}
									on:mouseleave={() =>
									{if(event.type === "rehearsal"){
										commentMapRehearsal[event.id] = false;
									}
									else{
										commentMapConcert[event.id] = false;
									}}}
									>
									<Fa icon={faCommentDots} class="text-[16px]" style="color: #6B9AD9;" />
									<div class="tooltip font-s pointer-events-none {commentMapConcert[event.id]||commentMapRehearsal[event.id] ? 'visible' : ''}">
										<p><strong>Comment :</strong> {event.comment}</p>
									</div>
									</button>
									{/if}
								</td>
								<td
									class="border-y-[1.5px] border-[#B6B6B6] rounded-r-2xl border-r-[1.5px] pr-4 text-right
									{todayIso > event.startDate ? "bg-[#EDEDED]" : ""}"
								>
									{#if event.type === 'rehearsal'}
										<div class="font-semibold bg-[#6B9AD9] text-white text-center rounded-lg p-1">
											{event.type}
										</div>
									{:else}
										<div class="font-semibold bg-[#a584d2] text-white text-center rounded-lg p-1">
											{event.type}
										</div>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
				{#if eventList.length > 6 }
					<button class="w-full flex justify-center"
					on:click={() => {showAllEvent = !showAllEvent}} >
						{#if !showAllEvent}
							<Fa icon={faChevronDown} class="text-[16px]" style="color: #8C8C8C;" />
						{:else}
							<Fa icon={faChevronUp} class="text-[16px]" style="color: #8C8C8C;" />
						{/if}
					</button>
				{/if}
			</ul>
		</div>
	</div>
</div>


<style>
  .tooltip-wrapper {
    position: relative;
    display: inline-block;
    cursor: pointer;
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
    z-index: 100;
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