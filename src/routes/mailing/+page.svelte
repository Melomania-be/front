<script lang="ts">
	import HtmlEditor from './HtmlEditor.svelte';

	let html = `here's some <strong>HTML!!!</strong>`;

	async function sendMail() {
		const response = await fetch('/api/mailing', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ html })
		});

		const data = await response.json();
		console.log(data);
	}
</script>

<div class="grid grid-cols-2">
	<h1 class="col-span-2">Mails</h1>
	<div class="m-2">
		<HtmlEditor bind:html />
		<button
			class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			on:click={sendMail}>Send</button
		>
	</div>
	<div class="m-2 border border-gray-500 rounded">
		{@html html}
	</div>
</div>
