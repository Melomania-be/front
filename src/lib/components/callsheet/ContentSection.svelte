<script lang="ts">
	import type { Callsheet } from '$lib/types/Callsheet';

	export let callsheet: Callsheet;
	export let positionFilter: 'above' | 'below' | 'all' = 'all';

	// Le "$:" rend le tableau réactif si les données changent
	$: blocks = [...(callsheet.contents || [])]
		// 1. Filtre du serveur (au-dessus ou en-dessous)
		.filter(c => positionFilter === 'all' || (c.position ?? 'below') === positionFilter)
		// 2. Ton filtre (afficher uniquement ceux cochés pour l'inscription)
		.filter(c => c.show_on_registration === true || c.showOnRegistration === true)
		// 3. Tri du serveur (basé sur le nouvel ordre des blocs)
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

	// Sécurisation du localStorage pour éviter les erreurs côté serveur (SSR)
	const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
</script>

{#if blocks.length > 0}
	<div class="space-y-6">
		{#each blocks as content (content.id)}
			<div class="mb-4 p-3 sm:p-4 bg-white dark:bg-gray-800 overflow-hidden">
				<div class="text-center mb-4 sm:mb-6">
					<h2 class="text-xl sm:text-2xl font-bold text-slate-500 dark:text-white break-words">
						{@html content.title}
					</h2>
				</div>
				<div class="prose dark:prose-invert max-w-none prose-sm sm:prose-base overflow-hidden break-words">
					{@html content.text}
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
    :global(.prose) {
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
    }
    :global(.prose img) {
        max-width: 100% !important;
        height: auto !important;
        object-fit: cover;
        border-radius: 8px;
    }
    :global(.prose table) {
        display: block;
        max-width: 100%;
        overflow-x: auto;
        white-space: nowrap;
    }
    :global(.prose p) {
        word-break: break-word;
        overflow-wrap: break-word;
    }
    :global(.prose ul, .prose ol) {
        padding-left: 1rem;
    }
    :global(.prose blockquote) {
        margin-left: 0.5rem;
        margin-right: 0.5rem;
        padding-left: 1rem;
        padding-right: 0.5rem;
    }
    :global(.prose pre) {
        overflow-x: auto;
        max-width: 100%;
        white-space: pre-wrap;
        word-wrap: break-word;
    }
    :global(.prose iframe) {
        max-width: 100% !important;
        height: auto;
    }
    @media (max-width: 640px) {
        :global(.prose) { font-size: 0.875rem; line-height: 1.5; }
        :global(.prose h1) { font-size: 1.5rem; }
        :global(.prose h2) { font-size: 1.25rem; }
        :global(.prose h3) { font-size: 1.125rem; }
        :global(.prose p) { margin-bottom: 0.75rem; }
        :global(.prose blockquote) { margin-left: 0; margin-right: 0; padding-left: 0.75rem; }
        :global(.prose ul, .prose ol) { padding-left: 0.75rem; }
    }
    @media (max-width: 360px) {
        :global(.prose) { font-size: 0.8rem; }
        :global(.prose table) { font-size: 0.75rem; }
    }
</style>