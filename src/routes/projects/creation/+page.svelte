<script lang="ts">
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import type { Project } from '$lib/types/Project';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import ProjectModifier from '$lib/components/project/ProjectModifier.svelte';
	import type { Piece } from '$lib/types/Piece';
	import type { SectionGroup } from '$lib/types/SectionGroup';
	import type { Folder } from '$lib/types/Folder';

	let listPieces: Array<Piece>;
	let listSectionGroups: Array<SectionGroup>;
	let listFolders: Array<Folder>;
	let loading: boolean = true;
	const responseHandler = new ResponseHandlerClient();
	const PROJECT_CREATION_DRAFT_KEY = 'projectCreationDraft';
	const PROJECT_PIECE_CREATION_PATH = '/library/pieces';

	const project: Project = {
		id: null,
		name: '',
		sectionGroupId: null,
		rehearsals: [],
		pieces: [],
		sectionGroup: null,
		concerts: [],
		responsibles: []
	};

	async function fetchPieces() {
		const responsePieces = await fetch(
			'/api/pieces?filter=&page=1&limit=10000&order=asc&orderBy=id',
			{
				method: 'GET'
			}
		);

		await responseHandler.handle(responsePieces, async () => {
			const tmp = await responsePieces.json();
			listPieces = tmp.data;
		});
	}

	async function fetchSectionGroups() {
		const responseSectionGroups = await fetch('/api/sectionGroups', {
			method: 'GET'
		});

		await responseHandler.handle(responseSectionGroups, async () => {
			listSectionGroups = await responseSectionGroups.json();
		});
	}

	async function fetchFolders() {
		const responseFolder = await fetch('/api/folders', {
			method: 'GET'
		});

		await responseHandler.handle(responseFolder, async () => {
			listFolders = await responseFolder.json();
		});

		if (!listFolders) {
			listFolders = [];
		}
	}

	function restoreProjectDraft() {
		if (!browser) return;

		const rawDraft =
			window.sessionStorage.getItem(PROJECT_CREATION_DRAFT_KEY) ||
			window.localStorage.getItem(PROJECT_CREATION_DRAFT_KEY);
		if (!rawDraft) return;

		try {
			const draft = JSON.parse(rawDraft);
			const selectedPieceIds = Array.isArray(draft.pieceIds) ? draft.pieceIds.map(Number) : [];
			const orderedPieces = selectedPieceIds
				.map((pieceId: number) =>
					listPieces.find((piece: Piece) => Number(piece.id) === pieceId)
				)
				.filter((piece: Piece | undefined): piece is Piece => Boolean(piece));

			project.name = draft.name || '';
			project.sectionGroup =
				listSectionGroups.find(
					(sectionGroup) => Number(sectionGroup.id) === Number(draft.sectionGroupId)
				) || null;
			project.folder =
				listFolders.find((folder) => Number(folder.id) === Number(draft.folderId)) || undefined;
			project.pieces = orderedPieces;
			project.rehearsals = Array.isArray(draft.rehearsals)
				? draft.rehearsals.map((rehearsal: any) => ({
						...rehearsal,
						startDate: rehearsal.startDate ? new Date(rehearsal.startDate) : new Date(),
						endDate: rehearsal.endDate ? new Date(rehearsal.endDate) : new Date()
					}))
				: [];
			project.concerts = Array.isArray(draft.concerts)
				? draft.concerts.map((concert: any) => ({
						...concert,
						startDate: concert.startDate ? new Date(concert.startDate) : new Date(),
						endDate: concert.endDate ? new Date(concert.endDate) : new Date()
					}))
				: [];
			project.responsibles = Array.isArray(draft.responsibles) ? draft.responsibles : [];
		} catch (error) {
			window.sessionStorage.removeItem(PROJECT_CREATION_DRAFT_KEY);
			window.localStorage.removeItem(PROJECT_CREATION_DRAFT_KEY);
		}
	}

	function clearProjectDraft() {
		if (!browser) return;
		window.sessionStorage.removeItem(PROJECT_CREATION_DRAFT_KEY);
		window.localStorage.removeItem(PROJECT_CREATION_DRAFT_KEY);
	}

	function shouldKeepDraftOnNavigation(pathname: string, search: string) {
		if (pathname !== PROJECT_PIECE_CREATION_PATH) return false;
		const params = new URLSearchParams(search);
		return params.get('fromProjectCreation') === '1';
	}

	beforeNavigate((navigation) => {
		if (!browser) return;
		if (!navigation.to?.url) {
			clearProjectDraft();
			return;
		}

		const { pathname, search } = navigation.to.url;
		if (pathname === '/projects/creation') return;
		if (shouldKeepDraftOnNavigation(pathname, search)) return;
		clearProjectDraft();
	});

	onMount(async () => {
		await Promise.all([fetchPieces(), fetchSectionGroups(), fetchFolders()]);
		restoreProjectDraft();
		loading = false;
	});
</script>

{#if loading}
    <p>Loading...</p>
{:else}
    <ProjectModifier
        mode="create"
        {project}
        bind:pieces={listPieces}
        bind:sectionGroups={listSectionGroups}
        bind:folders={listFolders}
        urlFront={`/projects/creation`}
    />
{/if}
