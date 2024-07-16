<script lang="ts">
	import { onMount } from 'svelte';
	import HtmlEditor from './HtmlEditor.svelte';
	import type { MailTemplate } from '$lib/types/MailTemplate';

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

	let useTemplate = false;
	let templates : MailTemplate[] = [];
	let selectedTemplate: MailTemplate = null;

	async function sendCallsheetNotification() {
        console.log('Send Callsheet Notification');
        let contact = {
            id : 1,
            first_name: 'Judith',
            last_name: 'Lecoq',
            email: 'lecoqjudith@gmail.com',
        };

        let project = {
            id: 1, 
            name: 'Test'
        };

        let callsheet =  {
            id: 1,
            version: '1.0',
            project_id: 1
        };

        let to_contact = {
            first_name: 'Prénom',
            last_name: 'Nom',
            email: 'adresse@contact.com',
            phone: '01 23 45 67 89',
            messenger: 'messenger'
        };

        const data = {
            contact: contact,
            project: project,
            callsheet: callsheet,
            to_contact: to_contact,
        };

        try {
            const resMail = await fetch('/api/mailing/sendCallsheetNotifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    async function sendRegistrationNotification() {
        console.log('Send Registration (confirmation) Notification');
        let contact = {
            id : 1,
            first_name: 'Judith',
            last_name: 'Lecoq',
            email: 'lecoqjudith@gmail.com'
        };

        let project = {
            id: 1, 
            name: 'Test'
        };

        let callsheet =  {
            id: 1,
            version: '1.0',
            project_id: 1
        };

        let to_contact = {
            first_name: 'Prénom',
            last_name: 'Nom',
            email: 'contact@mail.com',
            phone: '01 23 45 67 89',
            messenger: 'messenger'
        };

        const data = {
            contact: contact,
            project: project,
            callsheet: callsheet,
            to_contact: to_contact,
        };

        try {
            const resMail = await fetch('/api/mailing/sendRegistrationNotifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    async function sendRecommendationNotification() {
        console.log('Send Recommendation Notification');
        let contact = {
            first_name: 'Judith',
            last_name: 'Lecoq',
            email: 'lecoqjudith@gmail.com',
        };

        let project = {
            id: 1, 
            name: 'Test'
        };

        let registration =  {
            id: 1,
            version: '1.0',
            project_id: 1
        };

        const data = {
            contact: contact,
            project: project,
            registration: registration,
        };

        try {
            const resMail = await fetch('/api/mailing/sendRecommendationNotifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }


	onMount(async () => {
        const res = await fetch('/api/templates');
        const data = await res.json();
        templates = data;
    });

</script>

<div class="m-2">
<br>
<button class="m-2 p-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" on:click={sendCallsheetNotification}>Send Callsheet Notification</button>
<button class="m-2 p-2 bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded" on:click={sendRegistrationNotification}>Send Confirmation Notification</button>
<button class="m-2 p-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" on:click={sendRecommendationNotification}>Send Recommendation Notification</button>
<br>
<button class="m-2 p-2 bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded" on:click={() => {window.location.href = '/mailing/templates';}}>Template Manager</button>
<br>
<br>


{#if useTemplate === true}
	<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" on:click={() => useTemplate = false}>Use unique mail</button>
	<h1>Send template mail</h1>
	<div class="grid grid-cols-2">
		<h1 class="col-span-2">Templates</h1>
		<select
			class="m-2"
			bind:value={selectedTemplate}
		>
			{#each templates as template}
				<option value={template}>{template.name}</option>
			{/each}
		</select>
	</div>

{:else}
	<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" on:click={() => useTemplate = true}>Use template</button>
	<h1>Send unique mail</h1>
	<div class="grid grid-cols-2">
		<h1 class="col-span-2">Mails</h1>
		<div class="m-2">
    	    <HtmlEditor bind:content={html} />
			<button
				class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
				on:click={sendMail}>Send</button
			>
		</div>
		<div class="m-2 border border-gray-500 rounded">
			{@html html}
		</div>
	</div>
{/if}

</div>