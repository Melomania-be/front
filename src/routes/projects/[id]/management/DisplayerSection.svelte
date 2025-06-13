<script lang="ts">
	import DateShow from '$lib/components/DateShow.svelte';
	import { comment } from 'postcss';
	import { faCalendar } from '@fortawesome/free-regular-svg-icons';
	import { faLocationDot , faCommentDots , faChevronDown , faChevronUp } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';
	import SortableMin from 'sortablejs';

	export let project: any;

  const map = new Map<number, number>();

  for (const section of project.sectionGroup?.sections) {
    map.set(section.id, 0);
  }

  for (const p of project.participants) {
    const current = map.get(p.sectionId) ?? 0;
    map.set(p.sectionId, current + 1);
  }
  console.log("map" , map)
  

  const sortedEntries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  let countArray: [number, number][] = Array.from(map);

    let showParticipantsNumber = false;

    let sort : boolean = false;

    function changeSorting(){
      sort = !sort;
      if(sort){
        countArray = sortedEntries;
      }
      else{
        countArray = Array.from(map);
      }
    }
</script>

<div
	class="px-4 py-4 w-full border-[#8C8C8C] rounded-[10px] border-2 bg-white dark:bg-gray-800 dark:border-gray-700"
>
	<div class="flex items-center">
		<h1 class="font-bold text-lg">SECTION</h1>
        
		<div class="ml-auto">
			<a
				class="text-white font-bold text-sm bg-[#6B9AD9] p-2 rounded-[8px]"
				href="/projects/{project.id}/management/modify">Edit</a
			>
		</div>
        
	</div>
    {#if project.sectionGroup}
    <p class="mb-4 text-sm">Group Section : { project.sectionGroup.name}</p>
    <div class="text-xs gap-2 text-center">
        <div class="flex flex-row gap-2 w-full h-[100px] border-t border-t-dotted border-l-2 border-l-[#8C8C8C] px-1">
        {#each countArray as [section , participantCount]}
            <button
            on:mouseenter={() => showParticipantsNumber = true}
			      on:mouseleave={() => showParticipantsNumber = false}
            class="tooltip-wrapper flex-1 mt-auto mb-0 max-h-[99px] rounded-t
            { participantCount >= project.sectionGroup.sections.find(s => s.id === section).size ? "bg-[#D1A9FF] hover:bg-purple-400" : "bg-blue-200 hover:bg-blue-300"}"
            style="height: { participantCount / project.sectionGroup.sections.find(s => s.id === section).size *100}%;">
            <div class="tooltip font-s pointer-events-none {showParticipantsNumber ? 'visible' : ''}">
					<p class="text-[10px]"> {participantCount} / {project.sectionGroup.sections.find(s => s.id === section).size} </p>
				</div>
            </button>
        {/each}
        </div>
        <hr class="border border-[#8C8C8C]"/>
        <div class="flex gap-2 w-full border-l-2 border-white px-1">
        {#each countArray as [section , participantCount]}
            <p class="flex-1 leading-tight text-[8px]">{project.sectionGroup.sections.find(s => s.id === section).name}</p>
        {/each}
        </div>
    </div>
    <button class="text-white font-bold text-sm bg-[#6B9AD9] p-2 rounded-[8px]"
    on:click={() => changeSorting()}
    >sort</button>
    {:else}
        <p class="text-sm text-center mb-4"> No Section Group </p>
    {/if}
</div>


<style>
  .tooltip-wrapper {
    position: relative;
    display: inline-block;
    cursor: pointer;
  }

  .tooltip {
    position: absolute;
    bottom: 95%; /* au-dessus de l'élément */
	margin-top: 0.5rem;
  	left: 50%;
  	transform: translateX(-50%);
	width: 30vw;
    color: #000000;
	font-weight: 400;
    padding: 0.4rem 0.6rem;
    border-radius: 5px;
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
	}

  .tooltip.visible {
    opacity: 1;
  }
</style>