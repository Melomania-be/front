<script lang="ts">
	export let content: string;
	let editorContent: string = '';
	let authorized = true;

	let rawValue = '';
	let textArea: HTMLTextAreaElement;

	let authorizedTags = [
		'strong',
		'em',
		'u',
		'a',
		'img',
		'br',
		'b',
		'i',
		'span',
		'!DOCTYPE',
		'html',
		'head',
		'meta',
		'title',
		'style',
		'body',
		'div',
		'table',
		'tr',
		'td',
		'h1',
		'h3',
		'p',
		'v:background',
		'v:fill',
		'xml',
		'o:OfficeDocumentSettings',
		'!--[if',
		'!--[endif]--',
		'!--[if',
		'!--[endif]--',
		'!--[if',
		'![endif]--',
		'o:AllowPNG',
		'o:AllowPNG',
		'o:PixelsPerInch',
		'o:PixelsPerInch',
		'h2',
		'thead',
		'th',
		'tbody'
	];

	let errorMessage = '';

	$: {
		rawValue = content;
		if (checkRawValue(rawValue)) {
			console.log(rawValue);
			editorContent = formatText(rawValue);
		}
	}

	function checkRawValue(value: string) {
		let allTags =
			value
				.match(/<\s*\/?\s*([^\s>\/]+).*?>/g)
				?.map((tag) => tag.replace(/<\/?([^\s>\/]+).*?>/g, '$1')) || [];

		let success = true;
		let unauthorizedTags = [];

		for (let tag of allTags) {
			if (!authorizedTags.includes(tag)) {
				success = false;
				unauthorizedTags.push(tag);
			}
		}

		if (!success) {
			errorMessage =
				'Unauthorized tags found in the HTML! \nAuthorized tags are: ' +
				unauthorizedTags.join(', ');
		}

		return success;
	}

	function formatText(value: string) {
		let formattedValue = value;

		formattedValue = formattedValue.replace(/<strong>/g, '<b>');
		formattedValue = formattedValue.replace(/<\/strong>/g, '</b>');

		formattedValue = formattedValue.replace(/<em>/g, '<i>');
		formattedValue = formattedValue.replace(/<\/em>/g, '</i>');

		formattedValue = formattedValue.replace(/<u>/g, '<span style="text-decoration: underline;">');
		formattedValue = formattedValue.replace(/<\/u>/g, '</span>');

		formattedValue = formattedValue.replace(
			/<a href="/g,
			'<a style="color: blue; text-decoration: underline;" href="'
		);
		formattedValue = formattedValue.replace(
			/<a>/g,
			'<a style="color: blue; text-decoration: underline;" href="#">'
		);

		return formattedValue;
	}

	function addStrong(event: MouseEvent) {
		event.preventDefault();

		if (textArea.selectionStart === textArea.selectionEnd) {
			rawValue =
				rawValue.slice(0, textArea.selectionStart) +
				'<strong>' +
				rawValue.slice(textArea.selectionStart, textArea.selectionEnd) +
				'</strong>' +
				rawValue.slice(textArea.selectionEnd);
		} else {
			rawValue += '<strong></strong>';
		}
	}

	function addEm() {
		rawValue += '<em></em>';
	}

	function addU() {
		rawValue += '<u></u>';
	}

	function addA() {
		rawValue += '<a href=""></a>';
	}

	function onInput(event: any) {
		content = event.target.value;
	}
</script>

<div>
	<!--
	<span>
		<button on:click={addStrong}>Strong</button>
		<button>Em</button>
		<button>U</button>
		<button>A</button>
	</span>
    -->
	<textarea
		id="message"
		rows="4"
		class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
		placeholder="Write your html here..."
		bind:value={rawValue}
		bind:this={textArea}
		on:input={onInput}
	></textarea>
	{#if errorMessage}
		<p class="text-red-500">{errorMessage}</p>
	{/if}
</div>
