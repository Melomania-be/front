<script lang="ts">
	// On définit le type par défaut sur 'button' pour éviter qu'il soumette les formulaires par erreur
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let disabled: boolean = false;

	// En Svelte, 'class' est un mot réservé, on l'exporte donc comme ceci :
	let className: string = '';
	export { className as class };
</script>

<!--
  1. {...$$restProps} permet de passer automatiquement tous les autres attributs HTML (comme title="", id="", etc.)
  2. <slot /> est l'endroit où le texte ou les icônes à l'intérieur du bouton vont s'afficher
  3. Les on:click, on:keydown etc. (sans fonction) disent à Svelte de "transmettre" ces événements au parent
-->
<button
	{type}
	{disabled}
	class={className}
	{...$$restProps}
	on:click
	on:submit
	on:mouseenter
	on:mouseleave
	on:focus
	on:blur
>
	<slot />
</button>