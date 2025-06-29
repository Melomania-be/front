<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import RichTextEditor from '$lib/components/callsheet/RichTextEditor.svelte';

	export let content: string;
	export let htmlMode: boolean = true;

	const dispatch = createEventDispatcher();

	let editorMode: 'visual' | 'html' = 'html'; // Start with HTML mode by default
	let visualContent = ''; // Separate variable for visual editor

	// Function to detect if content is a full HTML document
	function isFullHtmlDocument(content: string): boolean {
		if (!content) return false;
		const lowerContent = content.toLowerCase().trim();
		return lowerContent.includes('<!doctype') ||
			(lowerContent.includes('<html') && lowerContent.includes('<head') && lowerContent.includes('<body'));
	}

	// Function to extract body content for visual editor
	function extractBodyContent(htmlContent: string): string {
		if (!htmlContent || htmlContent.trim() === '') return '';

		if (isFullHtmlDocument(htmlContent)) {
			const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
			if (bodyMatch) {
				const extracted = bodyMatch[1].trim();
				return extracted;
			}
		}
		return htmlContent;
	}

	// Function to wrap visual content back into full HTML document
	function wrapInFullDocument(bodyContent: string, originalContent: string): string {
		if (!originalContent || !isFullHtmlDocument(originalContent)) {
			return bodyContent;
		}

		// Extract head content from original
		const headMatch = originalContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
		const headContent = headMatch ? headContent[1] : '';

		// Extract body attributes from original
		const bodyAttrMatch = originalContent.match(/<body([^>]*)>/i);
		const bodyAttrs = bodyAttrMatch ? bodyAttrMatch[1] : '';

		return `<!DOCTYPE html>
<html lang="fr">
<head>
${headContent}
</head>
<body${bodyAttrs}>
${bodyContent}
</body>
</html>`;
	}

	function handleTextareaInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		content = target.value;

		// Update visual content when HTML changes
		updateVisualContent();

		dispatch('input', content);
	}

	function handleRichEditorChange(newValue: string) {
		// Update visual content
		visualContent = newValue;

		// Update main content - wrap back if it was a full document
		if (isFullHtmlDocument(content)) {
			content = wrapInFullDocument(newValue, content);
		} else {
			content = newValue;
		}

		dispatch('input', content);
	}

	function updateVisualContent() {
		const extracted = extractBodyContent(content);
		visualContent = extracted;
	}

	function switchToVisual() {
		editorMode = 'visual';
		// Update visual content when switching
		updateVisualContent();
	}

	function switchToHTML() {
		editorMode = 'html';
	}

	// Update visual content when content prop changes
	$: if (content !== undefined) {
		updateVisualContent();
	}

	// Detect if current content is a full HTML document
	$: isFullDocument = isFullHtmlDocument(content);
</script>

<div class="h-[300px] mb-10">
	<!-- Mode Toggle -->
	<div class="mb-3 flex justify-between items-center border-b pb-2">
		<div class="flex items-center gap-2">
			<span class="text-sm text-gray-600 font-medium">Editor Mode:</span>
			{#if isFullDocument}
				<span class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full border">
					📄 Full HTML Document
				</span>
			{/if}
		</div>
		<div class="flex gap-2">
			<button
				class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
				class:bg-blue-500={editorMode === 'visual'}
				class:text-white={editorMode === 'visual'}
				class:bg-gray-200={editorMode !== 'visual'}
				class:text-gray-700={editorMode !== 'visual'}
				class:hover:bg-blue-600={editorMode === 'visual'}
				class:hover:bg-gray-300={editorMode !== 'visual'}
				on:click={switchToVisual}
			>
				📝 Visual Editor
			</button>
			<button
				class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
				class:bg-orange-500={editorMode === 'html'}
				class:text-white={editorMode === 'html'}
				class:bg-gray-200={editorMode !== 'html'}
				class:text-gray-700={editorMode !== 'html'}
				class:hover:bg-orange-600={editorMode === 'html'}
				class:hover:bg-gray-300={editorMode !== 'html'}
				on:click={switchToHTML}
			>
				💻 HTML Source
			</button>
		</div>
	</div>

	{#if editorMode === 'html'}
		<!-- HTML Source mode -->
		<div class="h-full">
			<div class="mb-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border">
				💡 <strong>HTML Mode:</strong> Edit raw HTML code directly.
				{#if isFullDocument}
					Complete HTML document detected - all structure and styles preserved.
				{:else}
					Simple HTML content - switch to Visual Editor to use formatting tools.
				{/if}
			</div>
			<textarea
				class="border-2 rounded-lg w-full h-[calc(100%-3rem)] p-3 text-sm font-mono resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
				bind:value={content}
				on:input={handleTextareaInput}
				placeholder="Enter your HTML content here...

Examples:
<h1>Title</h1>
<p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
<ul>
  <li>List item 1</li>
  <li>List item 2</li>
</ul>

For complete HTML documents:
&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
  &lt;title&gt;Email Template&lt;/title&gt;
  &lt;style&gt;
    body &#123; font-family: Arial, sans-serif; &#125;
  &lt;/style&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;h1&gt;Hello World&lt;/h1&gt;
&lt;/body&gt;
&lt;/html&gt;"
			></textarea>
		</div>
	{:else}
		<!-- Visual Editor mode - ALWAYS show RichTextEditor -->
		<div class="h-full">
			<div class="mb-2 text-xs text-gray-500 bg-blue-50 p-2 rounded border">
				✨ <strong>Visual Mode:</strong> Use the toolbar buttons to format text.
				{#if isFullDocument}
					Editing main content only - document structure preserved.
				{:else}
					Start typing or use the formatting tools above.
				{/if}
			</div>

			<!-- ALWAYS show RichTextEditor, even with empty content -->
			<div class="h-[calc(100%-3rem)] border border-gray-300 rounded-lg overflow-hidden">
				<RichTextEditor value={visualContent || ''} onChange={handleRichEditorChange} />
			</div>
		</div>
	{/if}
</div>

<style>
    /* Custom scrollbar for textarea */
    textarea::-webkit-scrollbar {
        width: 8px;
    }

    textarea::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }

    textarea::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
    }

    textarea::-webkit-scrollbar-thumb:hover {
        background: #a1a1a1;
    }

    /* Button focus states */
    button:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 1px;
    }

    /* Ensure RichTextEditor fills the container */
    :global(.ql-container) {
        height: 100% !important;
    }
</style>