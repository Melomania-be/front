<!-- src/routes/projects/[id]/management/ProjectHeadDisplayer.svelte -->
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
		faEnvelope,
		faMusic,
		faSheetPlastic,
		faTasks,
		faUsers,
		faWallet,
		faUserPlus,
		type IconDefinition,
		faEllipsis
	} from '@fortawesome/free-solid-svg-icons';
	import { browser } from '$app/environment';
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
	let auditionsUrl: string;
	let accountingUrl: string;
	let recruitmentUrl: string;
	let tasksUrl: string;

	let participantNotValidated: number = 0;

	let tabs: {
		url: string;
		name: string;
		icon: IconDefinition;
		notifications: number;
		num: number;
	}[] = [
		{ url: '', name: 'Project Details', icon: faDiagramProject, notifications: 0, num: 0 },
		{
			url: '',
			name: 'Participants',
			icon: faUsers,
			notifications: participantNotValidated,
			num: 1
		},
		{ url: '', name: 'Mailing', icon: faEnvelope, notifications: 0, num: 2 },
		{ url: '', name: 'Callsheet', icon: faSheetPlastic, notifications: 0, num: 3 },
		{ url: '', name: 'Attendances', icon: faCalendarCheck, notifications: 0, num: 4 },
		{ url: '', name: 'Auditions', icon: faMusic, notifications: 0, num: 5 },
		{ url: '', name: 'Accounting', icon: faWallet, notifications: 0, num: 6 },
		{ url: '', name: 'Recruitment', icon: faUserPlus, notifications: 0, num: 7 },
		{ url: '', name: 'Tasks', icon: faTasks, notifications: 0, num: 8 }
	];

	$: if (project) {
		participantsUrl = `/projects/${project.id}/management/participants`;
		maillingUrl = `/projects/${project.id}/management/mailing`;
		projectUrl = `/projects/${project.id}/management`;
		callsheetUrl = `/projects/${project.id}/management/callsheets`;
		attendanceUrl = `/projects/${project.id}/management/attendance`;
		auditionsUrl = `/projects/${project.id}/management/auditions`;
		accountingUrl = `/projects/${project.id}/management/accounting`;
		recruitmentUrl = `/projects/${project.id}/management/recruitment`;
		tasksUrl = `/projects/${project.id}/management/tasks`;

		participantNotValidated = 0;

		if (project?.participants) {
			for (const p of project.participants) {
				if (!p.accepted) {
					participantNotValidated++;
				}
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
			{ url: auditionsUrl, name: 'Auditions', icon: faMusic, notifications: 0, num: 5 },
			{ url: accountingUrl, name: 'Accounting', icon: faWallet, notifications: 0, num: 6 },
			{ url: recruitmentUrl, name: 'Recruitment', icon: faUserPlus, notifications: 0, num: 7 },
			{ url: tasksUrl, name: 'Tasks', icon: faTasks, notifications: 0, num: 8 }
		];
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

	function formatTimestamp(value: string | Date) {
	    return new Date(value).toLocaleDateString('en-GB', {
		    weekday: 'long',
		    day: 'numeric',
		    month: 'long',
		    year: 'numeric'
	    });
    }
</script>

<div class="bg-white">
	{#if !isMobile}
		{#if project}
			<div class="flex items-center p-2">
				<h1 class="text-4xl font-bold text-gray-500 ml-[1vw] mr-[1vw] mt-[3vh] mb-[3vh]">
					Project : {project.name}
				</h1>
				<div
					class="ml-4 inline-flex items-center px-3 py-1 mt-1 text-sm text-gray-400 border-[1.5px] rounded-lg"
				>
					<div class="">
						<p>
							Created at: {formatTimestamp(project.createdAt)} 
						</p>

						<p>
							Updated at: {formatTimestamp(project.updatedAt)}
						</p>

					</div>
				</div>
				<a
					href="/projects/{project.id}/management/modify"
					class="ml-auto mr-4 h-[50%] inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#6B9AD9] rounded-lg hover:bg-blue-800"
				>
					Edit Project
				</a>
			</div>
			<div class="pl-5 w-full text-lg text-gray-400 font-semibold flex flex-wrap gap-[1vw] gap-y-1">
				{#each tabs as tab}
					<button
						class="flex items-center gap-2 p-3 whitespace-nowrap {selectedTab === tab.num
							? 'text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]'
							: ''}"
						on:click={() => goto(tab.url)}
					>
						<Fa
							icon={tab.icon}
							class="text-[16px]"
							style="color: {selectedTab === tab.num ? '#6B9AD9;' : ' #9ca3af;'}"
						/>
						{tab.name}
						{#if tab.notifications && tab.notifications > 0}
							<div
								class="bg-red-400 text-white w-[19px] h-[19px] rounded-full text-[0.9rem] text-center flex justify-center -mt-3 -ml-1"
							>
								<span class="-mt-[4px]">{tab.notifications}</span>
							</div>
						{/if}
					</button>
				{/each}
			</div>
		{:else}
			<div class="flex items-center p-2">
				<h1 class="text-4xl font-bold text-gray-500 ml-[1vw] mr-[1vw] mt-[3vh] mb-[3vh]">
					Project : Loading...
				</h1>
				<div
					class="ml-4 inline-flex items-center px-3 py-1 mt-1 text-sm text-gray-400 border-[1.5px] rounded-lg"
				>
					<div class="">
						<p>Created at : -</p>
						<p>Updated at : -</p>
					</div>
				</div>
				<span
					class="ml-auto mr-4 h-[50%] inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#6B9AD9] rounded-lg"
				>
					Edit Project
				</span>
			</div>
			<div class="ml-5 w-full text-lg text-gray-400 font-semibold flex flex-wrap gap-[1vw] gap-y-1">
				{#each tabs as tab}
					<button
						class="flex items-center gap-2 p-3 whitespace-nowrap {selectedTab === tab.num
							? 'text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]'
							: ''}"
					>
						<Fa
							icon={tab.icon}
							class="text-[16px]"
							style="color: {selectedTab === tab.num ? '#6B9AD9;' : ' #9ca3af;'}"
						/>
						{tab.name}
						{#if tab.notifications && tab.notifications > 0}
							<div
								class="bg-red-400 text-white w-[19px] h-[19px] rounded-full text-[0.9rem] text-center flex justify-center -mt-3 -ml-1"
							>
								<span class="-mt-[4px]">{tab.notifications}</span>
							</div>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	{:else}
		<div
			class="flex {screenDirection === 'horizontal'
				? 'flex-row'
				: 'flex-col'} items-center p-2 w-screen mb-2"
		>
			<h1 class="text-4xl font-bold text-gray-500 mr-4 mb-4">
				Project : {project ? project.name : 'Loading...'}
			</h1>
			<div
				class="grid items-center m-1 {screenDirection === 'horizontal'
					? 'ml-auto w-[50%]'
					: 'w-full'} mr-2 grid-cols-[2fr_1fr] gap-2"
			>
				<div
					class="inline-flex items-center px-3 py-1 mt-1 text-sm text-gray-400 border-2 rounded-lg max-w-[250px]"
				>
					<div class="">
						<p>
							Created at : {#if project}<DateShow startTime={project.createdAt} />{:else}
								-
							{/if}
						</p>
						<p>
							Updated at : {#if project}<DateShow startTime={project.updatedAt} />{:else}
								-
							{/if}
						</p>
					</div>
				</div>
				{#if project}
					<a
						href="/projects/{project.id}/management/modify"
						class="ml-auto mt-auto flex items-center h-[40px] px-3 py-2 text-sm font-medium text-center text-white bg-[#6B9AD9] rounded-lg hover:bg-blue-800"
					>
						<span>Edit Project</span>
					</a>
				{:else}
					<span
						class="ml-auto mt-auto flex items-center h-[40px] px-3 py-2 text-sm font-medium text-center text-white bg-[#6B9AD9] rounded-lg hover:bg-blue-800"
					>
						Edit Project
					</span>
				{/if}
			</div>
		</div>
		<div
			class="w-full flex flex-wrap justify-center gap-3 px-2 py-2 text-xs text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700"
		>
			{#each tabs as tab}
				<button
					class="flex items-center gap-1 p-1.5 {selectedTab === tab.num
						? 'text-[#6B9AD9] border-b-[2px] border-[#6B9AD9]'
						: ''}"
					on:click={() => goto(tab.url)}
				>
					<Fa
						icon={tab.icon}
						class="text-[12px]"
						style="color: {selectedTab === tab.num ? '#6B9AD9;' : ' #9ca3af;'}"
					/>
					{tab.name}
					{#if tab.notifications && tab.notifications > 0}
						<div
							class="bg-red-400 text-white w-[16px] h-[16px] rounded-full text-[0.7rem] text-center flex justify-center -ml-1"
						>
							<span class="-mt-[2px]">{tab.notifications}</span>
						</div>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
