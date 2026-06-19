<!-- src/routes/shared/folders/[token]/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import SharedFolderViewer from '$lib/components/filesystem/SharedFolderViewer.svelte';

	$: token = $page.params.token;
</script>

<svelte:head>
	<title>Shared Folder - File Manager</title>
	<meta name="description" content="View shared folder contents" />
</svelte:head>

<SharedFolderViewer {token} />
