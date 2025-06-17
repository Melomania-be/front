<script lang="ts">
	import DateShow from '$lib/components/DateShow.svelte';
	import { comment } from 'postcss';
	import { faCalendar } from '@fortawesome/free-regular-svg-icons';
	import { faLocationDot , faCommentDots , faChevronDown , faChevronUp , faArrowDownWideShort} from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';
	import SortableMin from 'sortablejs';
	import type { Participant } from '$lib/types/Participant';
	import { onMount } from 'svelte';

	export let project: any;
  export let participants : Participant[];
  export let participantsNotValidated : Array<any>;

  console.log("PARTICPANTS ZEZEZ ", participantsNotValidated);

  const map = new Map<number, number>();

  const sectionSizeMap = new Map<number, number>();

  if(project.sectionGroup){
    for (const section of project.sectionGroup?.sections) {
      sectionSizeMap.set(section.id, section.size);
    }
    console.log("Size map" , sectionSizeMap)

    for (const section of project.sectionGroup?.sections) {
      map.set(section.id, 0);
    }

    for (const p of project.participants) {
      const current = map.get(p.sectionId) ?? 0;
      map.set(p.sectionId, current + 1);
    }
    console.log("map" , map)
  }
  

  const sortedEntries = Array.from(map.entries()).sort((a, b) => {
    const sizeA = sectionSizeMap.get(a[0]) ?? 1; // fallback to 1 to avoid division by zero
    const sizeB = sectionSizeMap.get(b[0]) ?? 1;

    const fillRateA = a[1] / sizeA;
    const fillRateB = b[1] / sizeB;

    return fillRateB - fillRateA; // descending order
  });

  let countArray: [number, number][] = Array.from(map);

    let showParticipantsNumber = false;

    let sort : boolean = false;

    let clickedStyle = " text-white bg-[#6B9AD9] border-[#6B9AD9] border-2";

    function changeSorting(){
      sort = !sort;
      if(sort){
        countArray = sortedEntries;
        clickedStyle = "border-2 text-[#6B9AD9] border-[#6B9AD9]"
      }
      else{
        countArray = Array.from(map);
        clickedStyle = " text-white bg-[#6B9AD9] border-[#6B9AD9] border-2";
      }
    }

    let popUpSection = false;

    let sectionName : string;
    let participantsInSection : Participant[];

    function openPopUpSection(name : string , participants : Participant[]){
      sectionName = name;
      participantsInSection = participants;
      popUpSection = true;
    }

    function sectionParticipantsList(sectionId : number){
      let sectionParticipantList : Participant[] = [];
      
      for (const p of participants){
        if(p.sectionId === sectionId){
          sectionParticipantList.push(p);
        }
      }
      for (const p of participantsNotValidated){
        if(p.sectionId === sectionId){
          sectionParticipantList.push(p);
        }
      }
      return sectionParticipantList;
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
</script>

{#if popUpSection}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div class="bg-white p-6 rounded-xl shadow-xl h-auto items-center flex justify-center flex-col
     {isMobile ? "w-[90%]" : "w-1/3"}">
			<h2 class="text-lg text-gray-500 font-bold uppercase text-center">Statistics</h2>
			<div class="h-full w-[95%] mb-4">
					<h3 class="my-4 text-gray-500"><strong>Section : </strong> {sectionName}</h3>
          <div class="{participantsInSection.length > 1 ? "grid grid-cols-2" : "mx-[25%]"}">
            {#each participantsInSection as p}
              <p class="text-sm border whitespace-nowrap truncate overflow-hidden border-gray-400 rounded-full text-center my-1 px-2 mx-1 font-semibold text-gray-500 {participantsNotValidated.find((pnv) => pnv.id === p.id) ? "bg-gray-200" : "bg-white"}">
									{p.contact.firstName}
                  {p.contact.lastName}
							</p>
            {/each}
          </div>
				</div>
			<button
				class="w-[30%] px-4 py-2 bg-[#6b9ad9] text-white rounded"
				on:click={() => {
					popUpSection = false;
				}}>OK</button
			>
		</div>
	</div>
{/if}


<div
	class="px-4 py-4 w-full border-[#8C8C8C] rounded-[10px] border-2 bg-white dark:bg-gray-800 dark:border-gray-700"
>
	<div class="flex items-center">
		<h1 class="font-bold text-lg">SECTIONS</h1>
        
		<div class="ml-auto">
			<a
				class="text-white font-bold text-sm bg-[#6B9AD9] p-2 rounded-[8px]"
				href="/projects/{project.id}/management/modify">Edit</a
			>
		</div>
        
	</div>
    {#if project.sectionGroup}
      {#if !isMobile}
        <p class="mb-4 text-sm">Section Group : { project.sectionGroup.name}</p>
        <div class="text-xs gap-2 text-center">
            <div class="flex flex-row gap-2 w-full h-[100px] border-t border-t-dotted border-l-2 border-l-[#8C8C8C] px-1">
            {#each countArray as [section , participantCount]}
                <button
                on:mouseenter={() => showParticipantsNumber = true}
                on:mouseleave={() => showParticipantsNumber = false}
                on:click={()=> {openPopUpSection(project.sectionGroup.sections.find(s=> s.id === section).name ?? 'Name not found' , sectionParticipantsList(section))}}
                class="tooltip-wrapper flex-1 mt-auto mb-0 max-h-[99px] rounded-t
                {participantCount >= (sectionSizeMap.get(section) ?? 1) ? "bg-[#D1A9FF] hover:bg-purple-400" : "bg-blue-200 hover:bg-blue-300"}"
                style="height: { participantCount / (sectionSizeMap.get(section) ?? 1) *100}%;">
                
                <div class="tooltip font-s pointer-events-none {showParticipantsNumber ? 'visible' : ''}">
                  <p class="text-[10px]"> {participantCount} / {(sectionSizeMap.get(section) ?? 1)} </p>
                </div>
                </button>
            {/each}
            </div>
            <hr class="border border-[#8C8C8C]"/>
            <div class="flex gap-2 w-full border-l-2 border-white px-1">
            {#each countArray as [section , participantCount]}
                <p class="flex-1 leading-tight text-[8px]">{project.sectionGroup.sections.find(s=> s.id === section).name ?? 'undef'}</p>
            {/each}
            </div>
        </div>
        <button class="flex items-center gap-1 font-bold text-sm p-2 rounded-[8px] mt-4 {clickedStyle}"
        on:click={() => changeSorting()}
        >
        <Fa icon={faArrowDownWideShort} class="text-[14px]" style="color: {!sort ? "white" : "#6B9AD9" };" />
        Fill Rate
        </button>
      {/if}
      {#if isMobile}
        <p class="mb-4 text-sm">Section Group : { project.sectionGroup.name}</p>
        <div class="text-xs h-auto grid grid-cols-[2fr_6fr_1fr] w-full">
          {#each countArray as [section , participantCount]}
            <div class="flex h-full flex-col w-full border-l-2 border-white px-1 text-right">
              <p class="flex-1 leading-tight text-[9px] pt-[0.1rem]">{project.sectionGroup.sections.find(s=> s.id === section).name ?? 'undef'}</p>
            </div>
            <div class="flex flex-col gap-2 py-1">
                  <button
                  on:click={()=> {openPopUpSection(project.sectionGroup.sections.find(s=> s.id === section).name ?? 'Name not found' , sectionParticipantsList(section))}}
                  class="flex-1 mr-auto ml-0 max-w-full rounded-r
                  {participantCount >= (sectionSizeMap.get(section) ?? 1) ? "bg-[#D1A9FF] hover:bg-purple-400" : "bg-blue-200 hover:bg-blue-300"}"
                  style="width: { participantCount / (sectionSizeMap.get(section) ?? 1) *100}%;">
                  </button>
            </div>
            <div class="flex flex-col h-full ml-3 items-center">
               <p class="text-[8px]"> {participantCount}/{(sectionSizeMap.get(section) ?? 1)} </p>
            </div>
          {/each}
            
        </div>
        <button class="flex items-center gap-1 font-bold text-sm p-2 rounded-[8px] mt-4 {clickedStyle}"
        on:click={() => changeSorting()}
        >
        <Fa icon={faArrowDownWideShort} class="text-[14px]" style="color: {!sort ? "white" : "#6B9AD9" };" />
        Fill Rate
        </button>
      {/if}
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