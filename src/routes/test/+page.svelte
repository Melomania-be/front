<script lang="ts">
	import { onMount } from 'svelte';

	onMount(async () => {
		let response = await fetch('/test/api', {
			method: 'POST'
		});

		console.log(response);

		if (response.status >= 400 && response.status < 500) {
			const jsonResponse = await response.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		}
	});
</script>

<div>test</div>
