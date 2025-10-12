<script lang="ts">
	import SectionGroupModifier from '$lib/components/sections/SectionGroupModifier.svelte';
	import { ListTree } from 'lucide-svelte';
	import ModuleHeader from '$lib/components/ModuleHeader.svelte';
</script>

<div>
	<ModuleHeader
		title="Sections & Instruments"
		description="Manage orchestra sections and instruments"
		icon={ListTree}
		showRefresh={false}
	/>
	<SectionGroupModifier />
</div>
