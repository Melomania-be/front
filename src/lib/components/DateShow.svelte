<script lang="ts">
	export let date: any;
	const options = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	};
</script>

<span>
	{new Date(date).toLocaleDateString(undefined, options)}
</span>
