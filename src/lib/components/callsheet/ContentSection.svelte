<script lang="ts">
	import type { Callsheet } from '$lib/types/Callsheet';

	export let callsheet: Callsheet;

	let blocks = [...(callsheet.contents || [])].sort((a, b) => a.position - b.position);

	const token = localStorage.getItem('token'); // ou sessionStorage.getItem('token')
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
    /* Gestion responsive du contenu texte */
    :global(.prose) {
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
    }

    /* Images responsives */
    :global(.prose img) {
        max-width: 100% !important;
        height: auto !important;
        object-fit: cover;
        border-radius: 8px;
    }

    /* Tableaux responsives */
    :global(.prose table) {
        display: block;
        max-width: 100%;
        overflow-x: auto;
        white-space: nowrap;
    }

    /* Gestion des longs mots et URLs */
    :global(.prose p) {
        word-break: break-word;
        overflow-wrap: break-word;
    }

    /* Listes responsives */
    :global(.prose ul, .prose ol) {
        padding-left: 1rem;
    }

    /* Blockquotes responsives */
    :global(.prose blockquote) {
        margin-left: 0.5rem;
        margin-right: 0.5rem;
        padding-left: 1rem;
        padding-right: 0.5rem;
    }

    /* Code blocks responsives */
    :global(.prose pre) {
        overflow-x: auto;
        max-width: 100%;
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    /* Iframes et embeds responsives */
    :global(.prose iframe) {
        max-width: 100% !important;
        height: auto;
    }

    /* Styles spécifiques mobile */
    @media (max-width: 640px) {
        :global(.prose) {
            font-size: 0.875rem;
            line-height: 1.5;
        }

        :global(.prose h1) {
            font-size: 1.5rem;
        }

        :global(.prose h2) {
            font-size: 1.25rem;
        }

        :global(.prose h3) {
            font-size: 1.125rem;
        }

        :global(.prose p) {
            margin-bottom: 0.75rem;
        }

        :global(.prose blockquote) {
            margin-left: 0;
            margin-right: 0;
            padding-left: 0.75rem;
        }

        :global(.prose ul, .prose ol) {
            padding-left: 0.75rem;
        }
    }

    /* Très petits écrans */
    @media (max-width: 360px) {
        :global(.prose) {
            font-size: 0.8rem;
        }

        :global(.prose table) {
            font-size: 0.75rem;
        }
    }
</style>