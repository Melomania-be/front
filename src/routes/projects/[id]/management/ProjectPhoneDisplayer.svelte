<script lang="ts">
	import type { Project } from '$lib/types/Project';
	import Dashboard from './Dashboard.svelte';
	import { goto } from '$app/navigation';
	import DateShow from '$lib/components/DateShow.svelte';
	import { onMount } from 'svelte';
	import Fa from 'svelte-fa';
	import {
		faCalendarCheck,
		faDiagramProject,
		faEllipsis,
		faEnvelope,
		faMusic,
		faSheetPlastic,
		faUsers,
		faWallet,
		type IconDefinition
	} from '@fortawesome/free-solid-svg-icons';
	import { Slice } from 'lucide-svelte';
	import { TableHead } from 'flowbite-svelte';
	import { fade, scale } from 'svelte/transition';

	export let project: any;

	export let selectedTab: number;

	let participantsUrl: string;
	let maillingUrl: string;
	let projectUrl: string;
	let callsheetUrl: string;
	let attendanceUrl: string;
	let auditionUrl: string;
	let accountingUrl: string;

	let participantNotValidated: number = 0;

	let tabs: {
		url: string;
		name: string;
		icon: IconDefinition;
		notifications: number;
		num: number;
	}[] = [
				{
					url: "",
					name: 'Project Details',
					icon: faDiagramProject,
					notifications: 0,
					num: 0
				},
				{
					url: "",
					name: 'Participants',
					icon: faUsers,
					notifications: participantNotValidated,
					num: 1
				},
				{ url: "", name: 'Mailing', icon: faEnvelope, notifications: 0, num: 2 },
				{ url: "", name: 'Callsheet', icon: faSheetPlastic, notifications: 0, num: 3 },
				{
					url: "",
					name: 'Attendances',
					icon: faCalendarCheck,
					notifications: 0,
					num: 4
				},
				{ url: "", name: 'Auditions', icon: faMusic, notifications: 0, num: 5 },
				{ url: "", name: 'Accounting', icon: faWallet, notifications: 0, num: 6 }
			];

	// Reactif : met à jour les URLs dès que project devient dispo
	$: if (project) {
		participantsUrl = `/projects/${project.id}/management/participants`;
		maillingUrl = `/projects/${project.id}/management/mailing`;
		projectUrl = `/projects/${project.id}/management`;
		callsheetUrl = `/projects/${project.id}/management/callsheets`;
		attendanceUrl = `/projects/${project.id}/management/attendance`;
		auditionUrl = `/projects/${project.id}/management/auditions`;
		accountingUrl = `/projects/${project.id}/management/accounting`;

		if (project?.participants) {
			for (const p of project.participants) {
				if (!p.accepted) {
					participantNotValidated++;
				}
			}

			tabs = [
				{
					url: projectUrl,
					name: 'Project Details',
					icon: faDiagramProject,
					notifications: 0,
					num: 0
				},
				{
					url: participantsUrl,
					name: 'Participants',
					icon: faUsers,
					notifications: participantNotValidated,
					num: 1
				},
				{ url: maillingUrl, name: 'Mailing', icon: faEnvelope, notifications: 0, num: 2 },
				{ url: callsheetUrl, name: 'Callsheet', icon: faSheetPlastic, notifications: 0, num: 3 },
				{
					url: attendanceUrl,
					name: 'Attendances',
					icon: faCalendarCheck,
					notifications: 0,
					num: 4
				},
				{ url: auditionUrl, name: 'Auditions', icon: faMusic, notifications: 0, num: 5 },
				{ url: accountingUrl, name: 'Accounting', icon: faWallet, notifications: 0, num: 6 }
			];
		}
	}

	let isMobile = false;
	let screenDirection: 'horizontal' | 'vertical' = 'vertical';

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};

	const checkDirection = () => {
		screenDirection = window.innerWidth > window.innerHeight ? 'horizontal' : 'vertical';
	};

	onMount(() => {
		checkMobile();
		checkDirection();
		window.addEventListener('resize', checkMobile);
		window.addEventListener('resize', checkDirection);

		return () => {
			window.removeEventListener('resize', checkMobile);
			window.removeEventListener('resize', checkDirection);
		};
	});

	let showMoretabs = false;

	export function clickOutside(node: HTMLElement, callback: () => void) {
		const handleClick = (event: MouseEvent) => {
			if (!node.contains(event.target as Node)) {
				callback();
			}
		};

		document.addEventListener('click', handleClick, true);

		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}
</script>

<div
	class="fixed top-auto bottom-0 left-0 right-0 h-[50px] bg-white shadow-[0_0_10px_10px_rgba(0,0,0,0.1)] border-[#E7E7E7] flex justify-center items-center z-20 rounded-t-xl"
>
	{#if isMobile}
		{#if project}
			<!--Tabs-->
			<div class="ml-3 w-full text-lg text-gray-400 font-semibold flex mr-3">
				{#each tabs.slice(0, 5) as tab}
					<button
						class="flex-1 flex p-3 justify-center items-center"
						on:click={() => goto(tab.url)}
					>
						<div class="{selectedTab === tab.num ? ' bg-[#6B9AD9]' : ''} p-2 rounded-full">
							<Fa
								icon={tab.icon}
								class="text-[16px]"
								style="color: {selectedTab === tab.num ? 'white;' : '#8C8C8C;'}"
							/>
						</div>
						{#if tab.notifications}
							<div
								class="-mt-3 -ml-2 bg-red-400 text-white w-[15px] h-[15px] rounded-full text-[0.8rem] text-center flex justify-center"
							>
								<span class="-mt-[6.8px]">{participantNotValidated}</span>
							</div>
						{/if}
					</button>
				{/each}
				<button
					class="flex-1 flex p-3 justify-center items-center relative"
					on:click={() => (showMoretabs = !showMoretabs)}
				>
					<div class="p-2 rounded-full">
						<Fa icon={faEllipsis} class="text-[16px]" style="color: #8C8C8C;" />
					</div>
					{#if showMoretabs}
						<div
							use:clickOutside={() => (showMoretabs = false)}
							transition:scale={{ duration: 200, start: 0.9 }}
							class="absolute bg-white bottom-16 right-[1px] rounded-lg shadow-xl p-4"
						>
							<div class=" grid grid-cols-2 gap-2">
							{#each tabs.slice(5, tabs.length) as tab}
								<button
									class="flex-1 flex p-3 justify-center items-center"
									on:click={() => goto(tab.url)}
								>
									<div class="{selectedTab === tab.num ? ' bg-[#6B9AD9]' : ''} p-2 rounded-full">
										<Fa
											icon={tab.icon}
											class="text-[16px]"
											style="color: {selectedTab === tab.num ? 'white;' : '#8C8C8C;'}"
										/>
									</div>
									{#if tab.notifications}
										<div
											class="-mt-3 -ml-2 bg-red-400 text-white w-[15px] h-[15px] rounded-full text-[0.8rem] text-center flex justify-center"
										>
											<span class="-mt-[6.8px]">{participantNotValidated}</span>
										</div>
									{/if}
								</button>
							{/each}
							</div>
						</div>
					{/if}
				</button>
			</div>
		{:else}
			<div class="ml-3 w-full text-lg text-gray-400 font-semibold flex mr-3">
				{#each tabs.slice(0, 5) as tab}
					<button
						class="flex-1 flex p-3 justify-center items-center"
					>
						<div class="{selectedTab === tab.num ? ' bg-[#6B9AD9]' : ''} p-2 rounded-full">
							<Fa
								icon={tab.icon}
								class="text-[16px]"
								style="color: {selectedTab === tab.num ? 'white;' : '#8C8C8C;'}"
							/>
						</div>
						{#if tab.notifications}
							<div
								class="-mt-3 -ml-2 bg-red-400 text-white w-[15px] h-[15px] rounded-full text-[0.8rem] text-center flex justify-center"
							>
								<span class="-mt-[6.8px]">{participantNotValidated}</span>
							</div>
						{/if}
					</button>
				{/each}
				<button
					class="flex-1 flex p-3 justify-center items-center relative"
				>
					<div class="p-2 rounded-full">
						<Fa icon={faEllipsis} class="text-[16px]" style="color: #8C8C8C;" />
					</div>
					{#if showMoretabs}
						<div
							use:clickOutside={() => (showMoretabs = false)}
							transition:scale={{ duration: 200, start: 0.9 }}
							class="absolute bg-white bottom-16 right-[1px] rounded-lg shadow-xl p-4"
						>
							<div class=" grid grid-cols-2 gap-2">
							{#each tabs.slice(5, tabs.length) as tab}
								<button
									class="flex-1 flex p-3 justify-center items-center"
									on:click={() => goto(tab.url)}
								>
									<div class="{selectedTab === tab.num ? ' bg-[#6B9AD9]' : ''} p-2 rounded-full">
										<Fa
											icon={tab.icon}
											class="text-[16px]"
											style="color: {selectedTab === tab.num ? 'white;' : '#8C8C8C;'}"
										/>
									</div>
									{#if tab.notifications}
										<div
											class="-mt-3 -ml-2 bg-red-400 text-white w-[15px] h-[15px] rounded-full text-[0.8rem] text-center flex justify-center"
										>
											<span class="-mt-[6.8px]">{participantNotValidated}</span>
										</div>
									{/if}
								</button>
							{/each}
							</div>
						</div>
					{/if}
				</button>
			</div>
		{/if}
	{:else}
		<div></div>
	{/if}
</div>
