<script lang="ts">
	import type { MailTemplate } from "$lib/types/MailTemplate";
	import { onMount } from "svelte";
	import HtmlEditor from "../HtmlEditor.svelte";

    let selectedTemplate: MailTemplate = {
        id: null,
        name: '',
        content: '',
        createdAt: '',
        updatedAt: '',
    };

    let templates : MailTemplate[] = [];
    let editing = false;
    let newOne = false;

    async function newTemplate() {
        console.log('New Template');
        selectedTemplate = {
            id: null,
            name: '',
            content: null,
            createdAt: '',
            updatedAt: '',
        };
        editing = true;
        newOne = true;
    }

    async function saveTemplate(){
        console.log('Save Template');
        if (newOne) {
            const res = await fetch('/api/templates', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(selectedTemplate),
            });
            const data = await res.json();
            templates.push(data);
            selectedTemplate = data;
            newOne = false;
        } else {
            const res = await fetch(`/api/templates`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(selectedTemplate),
            });
            const data = await res.json();
            const index = templates.findIndex((template) => template.id === data.id);
            templates[index] = data;
            selectedTemplate = data;
        }
        editing = false;
    }

    async function cancelEdit() {
        console.log('Cancel Edit');
        selectedTemplate = templates[0];
        editing = false;
        newOne = false;
    }

    async function deleteTemplate() {
        console.log("delete");
        console.log("selectedTemplate", selectedTemplate);
        const res = await fetch(`/api/templates/${selectedTemplate.id}`, {
            method: 'DELETE',
        });

        const index = templates.findIndex((template) => template.id === selectedTemplate.id);
        templates.splice(index, 1);
        selectedTemplate = templates[0];
        alert('Template deleted');
    }

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
        selectedTemplate = data[0];
    });
</script>

<html lang="">
    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" on:click={sendCallsheetNotification}>Send Callsheet Notification</button>
    <button class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded" on:click={sendRegistrationNotification}>Send Confirmation Notification</button>
    <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" on:click={sendRecommendationNotification}>Send Recommendation Notification</button>

    <br>

    
    <h1 class="col-span-2">Templates</h1>
    {#if editing && newOne === true}
        <button class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" on:click={saveTemplate}>Save</button>
        <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" on:click={cancelEdit}>Cancel</button>

        <div class="m-2">
            <input type="text" bind:value={selectedTemplate.name} placeholder="Template Name" class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
        </div>
        <div class="m-2">
            <textarea 
                id="message"
                rows="4"
                class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Write your html here..."
                bind:value={selectedTemplate.content}
            ></textarea>
        </div>

    {:else if editing && newOne === false}
        <button class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" on:click={saveTemplate}>Save</button>
        <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" on:click={cancelEdit}>Cancel</button>

        <div class="m-2">
            <input type="text" bind:value={selectedTemplate.name} placeholder="Template Name" class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
        </div>
        <div class="m-2">
            <textarea 
                id="message"
                rows="4"
                class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Write your html here..."
                bind:value={selectedTemplate.content}
            ></textarea>
        </div>

        
    {:else if !editing}
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" on:click={newTemplate}>New Template</button>
        <p class="m-2">Template visualizer</p>
        <div>
            <select bind:value={selectedTemplate}>
                {#each templates as template}
                    <option value={template}>{template.name}</option>
                {/each}
            </select>
            <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" on:click={deleteTemplate}>Delete</button>
            <button class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" on:click={() => editing = true}>Edit</button>
        </div>
        <div class="grid grid-cols-2">
            {#if selectedTemplate}
                <h1 class="col-span-2">{selectedTemplate.name}</h1>
                <div class="m-2">
                    <HtmlEditor bind:content={selectedTemplate.content} />
                </div>
                <div class="m-2 border border-gray-500 rounded">
                    {@html selectedTemplate.content}
                </div>
            {/if}
        </div>
    {/if}
   

    
</html>
