<script lang="ts">
	import { onMount } from 'svelte';
	export let value = '';
	export let onChange: (content: string) => void;

	let editorElem: HTMLDivElement;
	let quill: any;

	onMount(async () => {
		if (typeof window !== 'undefined') {
			const Quill = (await import('quill')).default;
			await import('quill/dist/quill.snow.css');

			quill = new Quill(editorElem, {
				theme: 'snow',
				modules: {
					toolbar: [
						[{ header: [1, 2, 3, false] }],
						['bold', 'italic', 'underline', 'strike'],
						[{ color: [] }, { background: [] }],
						[{ list: 'ordered' }, { list: 'bullet' }],
						[{ indent: '-1' }, { indent: '+1' }],
						[{ align: [] }],
						['blockquote', 'code-block'],
						['link', 'image', 'video'],
						['clean']
					]
				},
				placeholder: 'Écrivez ici...'
			});

			// Remplit l'éditeur avec la valeur initiale
			quill.root.innerHTML = value;

			// Ajout image locale
			quill.getModule('toolbar').addHandler('image', () => {
				const input = document.createElement('input');
				input.setAttribute('type', 'file');
				input.setAttribute('accept', 'image/*');
				input.click();

				input.onchange = async () => {
					const file = input.files?.[0];
					if (file) {
						const reader = new FileReader();
						reader.onload = () => {
							const range = quill.getSelection();
							if (range) {
								quill.insertEmbed(range.index, 'image', reader.result);
							}
						};
						reader.readAsDataURL(file);
					}
				};
			});

			// Mise à jour du contenu
			quill.on('text-change', () => {
				onChange(quill.root.innerHTML);
			});

			// === Bouton personnalisé Google Maps ===
			const toolbarElem = editorElem.parentElement?.querySelector('.ql-toolbar');
			if (toolbarElem) {
				const mapButton = document.createElement('button');
				mapButton.innerHTML = '🗺️';
				mapButton.type = 'button';
				mapButton.title = 'Ajouter une carte Google Maps';

				mapButton.onclick = () => {
					const address = prompt("Entrez l'adresse à afficher sur la carte :");
					if (address) {
						const mapEmbed = `
							<div class="map-container" style="margin: 1rem 0;">
								<iframe
									src="https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed"
									width="100%" height="300"
									style="border:0; border-radius: 8px;"
									allowfullscreen="" loading="lazy"
									referrerpolicy="no-referrer-when-downgrade"
								></iframe>
								<p style="font-size: 0.9rem; color: #555;">📍 ${address}</p>
							</div>
						`;

						const range = quill.getSelection();
						if (range) {
							quill.clipboard.dangerouslyPasteHTML(range.index, mapEmbed);
							if (typeof onChange === 'function') {
								onChange(quill.root.innerHTML);
							}
						}
					}
				};

				const group = document.createElement('span');
				group.className = 'ql-formats';
				group.appendChild(mapButton);
				toolbarElem.appendChild(group);
			}
		}
	});
</script>

<style>
    /* Style pour les images et cartes */
    .ql-editor img,
    .ql-editor iframe {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 1rem 0;
    }

    .ql-editor .map-container {
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 8px;
        background-color: #f9f9f9;
    }

    .bg-white {
        background-color: white;
    }

    .dark .bg-gray-800 {
        background-color: #2D3748;
    }

    .rounded {
        border-radius: 8px;
    }

    .shadow {
        box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
    }

    .p-2 {
        padding: 8px;
    }

    .text-black {
        color: black;
    }
</style>

<div bind:this={editorElem} class="bg-white dark:bg-gray-800 rounded shadow p-2 min-h-[200px] text-black"></div>
