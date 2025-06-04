<script lang="ts">
	import DateShow from '$lib/components/DateShow.svelte';
	import { comment } from 'postcss';
	import { faCalendar } from '@fortawesome/free-regular-svg-icons';
	import { faLocationDot , faCommentDots , faChevronDown , faChevronUp } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';

	export let project: any;

    const countMap: Record<number, number> = {};

    for (const p of project.participants) {
    countMap[p.sectionId] = (countMap[p.sectionId] ?? 0) + 1;
    }
    console.log(countMap);

    let showParticipantsNumber = false;
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
    <p class="mb-4 text-sm">Group Section : {project.sectionGroup ? project.sectionGroup.name : "None"}</p>
    <div class="text-xs gap-2 text-center">
        <div class="flex flex-row gap-2 w-full h-[100px] border-t border-t-dotted border-l-2 border-l-[#8C8C8C] px-1">
        {#each project.sectionGroup.sections as section}
            <button
            on:mouseenter={() => showParticipantsNumber = true}
			on:mouseleave={() => showParticipantsNumber = false}
            class="tooltip-wrapper flex-1 mt-auto mb-0 max-h-[100px] rounded-t
            {(countMap[section.id] ? countMap[section.id] : 0) > section.size ? "bg-[#D1A9FF]" : "bg-blue-200"}"
            style="height: {(countMap[section.id] ? countMap[section.id] : 0) / section.size *100}%;">
            <div class="tooltip font-s pointer-events-none {showParticipantsNumber ? 'visible' : ''}">
					<p> {countMap[section.id] ? countMap[section.id] : 0} / {section.size} </p>
				</div>
            </button>
        {/each}
        </div>
        <hr class="border border-[#8C8C8C]"/>
        <div class="flex gap-2 w-full border-l-2 border-white px-1">
        {#each project.sectionGroup.sections as section}
            <p class="flex-1 leading-tight text-[8px]">{section.name}</p>
        {/each}
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