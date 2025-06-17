<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import DateShow from '$lib/components/DateShow.svelte';
	import HtmlEditor from '../../../../mailing/HtmlEditor.svelte';
	import type { Folder } from '$lib/types/Folder';
	import type { Project } from '$lib/types/Project.js';
	import { onMount, tick } from 'svelte';
	import type { MailTemplate } from '$lib/types/MailTemplate';
	import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';
	import ProjectPhoneDisplayer from '../ProjectPhoneDisplayer.svelte';

	let project: Project;
	let folders : Array<Folder>
	let selectedFolder: Folder;
	let OutputSrc = '';
	let html = '';
	let uniqueSubject = '';
	let selectedTemplate : MailTemplate;
	let templates : Array<MailTemplate>

	let url = '';
	if (typeof window !== 'undefined') {
		url = window.location.origin;
	}

	let lastRecruitmentNotificationSent = '';
	let lastCallsheetNotificationSent = '';

	let isSendingRecruitmentEmail = false;
	let isSendingCallsheetNotification = false;

	let useTemplate = false;

	$: id = $page.params.id;

	onMount(async () => {
		console.log('onMount');
		console.log('id', id);

		const projectRes = await fetch(`/api/projects/${id}`);
		if (projectRes.ok) {
			project = await projectRes.json();
		} else {
			console.error('Error fetching project data');
		}

		console.log('project', project);

		const resFolders = await fetch('/api/folders');
		const dataFolders = await resFolders.json();
		folders = dataFolders;

		console.log(folders);

		const res = await fetch('/api/templates');
		const data = await res.json();
		templates = data;

		const mailRes = await fetch(`/api/projects/${id}/management/mailing`);

		if (mailRes.ok) {
			const mailData = await mailRes.json();
			console.log('mailData', mailData);
			lastRecruitmentNotificationSent = mailData.lastRecruitmentNotificationSent;
			lastCallsheetNotificationSent = mailData.lastCallsheetNotificationSent;
			console.log('lastRecommendationNotificationSent', lastRecruitmentNotificationSent);
			console.log('lastCallsheetNotificationSent', lastCallsheetNotificationSent);
		} else {
			console.error('Error fetching mailing data');
		}
	});

	async function updateIframeContent() {
        await tick(); // Wait for iframe to load
        const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            if (doc) {
                doc.open();
                doc.write(`
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body>
                        ${selectedTemplate ? selectedTemplate.content : ""}
                    </body>
                    </html>
                `);
                doc.close();
            }
        }
    }

	async function updateIframeContentHtml() {
		await tick();
		const iframe = document.getElementById('preview-iframe2') as HTMLIFrameElement;
		if (iframe && iframe.contentWindow) {
			const doc = iframe.contentDocument || iframe.contentWindow.document;
			if (doc) {
				doc.open();
				doc.write(`
					<!DOCTYPE html>
					<html lang="en">
					<head>
						<meta charset="UTF-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
					</head>
					<body>
						${html}  <!-- Update with the latest HTML content -->
					</body>
					</html>
				`);
				doc.close();
			}
		}
	}

	async function sendRecruitmentEmail() {
		console.log('Send Recruitment Notification');
		let confirmSend = confirm('Are you sure you want to send a recruitment email to every contact ?');
		if (!confirmSend) {
			return;
		}

		isSendingRecruitmentEmail = true;

		const data = {
			projectId: id
		};

		try {
			const resMail = await fetch('/api/mailing/sendRecruitmentNotifications', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			if (resMail.ok) {
				alert('Mail successfully sent');
			} else if (resMail.status === 400) {
				const errorData = await resMail.json();
				alert(`Error: ${errorData.message}`);
			} else if (resMail.status === 500) {
				alert('Internal server error, please try again later');
			} else {
				alert('Unknown error occurred, please try again');
			}
		} catch (error) {
			console.error('Error sending email:', error);
			alert('Network error, please try again');
		} finally {
			lastRecruitmentNotificationSent = new Date().toString();
			isSendingRecruitmentEmail = false;
		}
	}

	async function sendCallsheetNotification() {
		let confirmSend = confirm('Are you sure you want to send a callsheet notification to all participants ?');
		if (!confirmSend) {
			return;
		}
		isSendingCallsheetNotification = true;
		console.log('Sends Callsheet Notification to all participants');

		const data = {
			projectId: id
		};

		try {
			const resMail = await fetch('/api/mailing/sendCallsheetNotifications', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			if (resMail.ok) {
				alert('Mail successfully sent');
			} else if (resMail.status === 400) {
				const errorData = await resMail.json();
				alert(
					`Check if all the fields required to send this mail are filled (Participants : ${url}/projects/${id}/management/participants , Callsheet : ${url}/projects/${id}/management/callsheets, Responsible : ${url}/projects/${id}/management/modify) Error: ${errorData.message}`
				);
			} else if (resMail.status === 500) {
				alert('Internal server error, please try again later');
			} else {
				alert('Unknown error occurred, please try again');
			}
		} catch (error) {
			console.error('Error sending email:', error);
			alert('Network error, please try again');
		} finally {
			lastCallsheetNotificationSent = new Date().toString();
			isSendingCallsheetNotification = false;
		}
	}

	function addImages(file: { path: any }) {
		OutputSrc = `<img file=${file.path}/>`;
	}

	async function sendMail(){
		console.log('Send mail');
		let confirmSend = confirm(
			`Are you sure you want to send this unique mail to the participants?`
		);
		if (!confirmSend) {
			return;
		}

		const data = {
			projectId: id,
			type: 'unique',
			templateId: null,
			subject: uniqueSubject,
			content: html
		};

		try {
			const resMail = await fetch('/api/mailing/sendMailToParticipants', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			if (resMail.ok) {
				alert('Mail successfully sent');
			} else {
				alert('An error occurred');
			}
		} catch (error) {
			console.error('Error sending email:', error);
			alert('Network error, please try again');
		}
	}

	async function sendTemplateToParticipants(){
		let confirmSend = confirm(
			`Are you sure you want to send this template to the participants?`
		);
		if (!confirmSend) {
			return;
		}

		const data = {
			projectId: id,
			type: 'template',
			templateId: selectedTemplate.id,
			subject: uniqueSubject,
			content: selectedTemplate.content
		};

		try {
			const resMail = await fetch('/api/mailing/sendMailToParticipants', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			if (resMail.ok) {
				alert('Mail successfully sent');
			} else {
				alert('An error occurred');
			}
		} catch (error) {
			console.error('Error sending email:', error);
			alert('Network error, please try again');
		}
	}

	function handleEditorInput(event: CustomEvent<string>) {
        html = event.detail;
        updateIframeContent();
    }

	// Call updateIframeContent whenever selectedTemplate changes
	$: if (selectedTemplate) {
        updateIframeContent();
    }

	$: if (html) {
		console.log("test");
		updateIframeContentHtml();
	}

	let isMobile = false;

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});
</script>


<ProjectHeadDisplayer {project} selectedTab={2} />

<div
	class="relative max-w-xxl bg-[#E7E7E7] shadow dark:bg-gray-800 dark:border-gray-700 p-4 pb-[80px]"
>
	<div class="grid-container">
		<div class="col-span-1 border-2 rounded-lg border-[#E35656] bg-white">
			<div class="p-3">
				<h2 class="text-lg font-bold text-[#E35656] uppercase">Important information</h2>
				<ul class="ml-4 mt-6 text-gray-500 mb-4">
					<li>
						<strong>Last recruitment email sent :</strong>
						{#if lastRecruitmentNotificationSent !== '' && lastRecruitmentNotificationSent !== null && lastRecruitmentNotificationSent !== undefined}
							<DateShow startTime={lastRecruitmentNotificationSent.toString()} />
						{:else}Never{/if}
					</li>
					<li>
						<strong>Last callsheet notification sent :</strong>
						{#if lastCallsheetNotificationSent !== '' && lastCallsheetNotificationSent !== null && lastCallsheetNotificationSent !== undefined}
							<DateShow startTime={lastCallsheetNotificationSent.toString()} />
						{:else}Never{/if}
					</li>
				</ul>
			</div>
		</div>

		<div class="col-span-1">
			<div class="mb-3">
				<p class="text-lg">
					To take a look or modify these default templates please go to
					<button
						class="text-blue-800 cursor-pointer hover:text-blue-400"
						on:click={() => goto('/mailing/templates/default')}
					>
						the default template editor.
					</button>
				</p>
			</div>
			<div class="">
				<div class="text-sm">
					<button
						class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#6B9AD9] hover:bg-[#4f7cb7] rounded-lg  focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
						on:click={sendRecruitmentEmail}
						disabled={isSendingRecruitmentEmail}
					>
						{isSendingRecruitmentEmail ? 'Sending...' : 'Send a recruitment email'}
					</button>
					<br>
					Note : Sending a recruitment notification will send an email to every contact (who accepts to receive emails and is validated) to ask them
					to participate in this project. The mail sent is based on the default recruitment template. (recruitment_notification.html)
				</div>
				<div class="text-sm pt-8">
					<button
						class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#6B9AD9] hover:bg-[#4f7cb7] rounded-lg focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
						on:click={sendCallsheetNotification}
						disabled={isSendingCallsheetNotification}
					>
						{isSendingCallsheetNotification ? 'Sending...' : 'Send a callsheet notification'}
					</button>
					<br>
					Note : Sending a callsheet notification will send an email to every participant accepted in this project asking them to
					take a look at the callsheet. The mail is based on the default callsheet template. (callsheet_notification.html)
				</div>
			</div>
		</div>
	</div>

	<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4 mt-4">
	{#if useTemplate === false}
		<h2 class="font-bold text-lg uppercase pb-4">Unique mail</h2>
		<button
			class="ml-10 text-white bg-[#6B9AD9] hover:bg-[#4f7cb7] focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
			on:click={() => (useTemplate = true)}>Use a template</button>
		<p class="ml-10">This email will be sent to every accepted participant in this project.</p>
		<div class="grid-container ml-10 mb-10 pt-5">
			<div class="border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
				<h2 class="text-xl font-bold mb-4">Write your email</h2>
				<div>
					<p>
						To add an image select a folder and click on the name of the image you want to add. You
						can now paste the appropriate line in the html below.<br />
						The image cannot appear in the preview but will be sent in the mail.
					</p>
					<br />
					{#if folders && folders.length > 0}
						<p>
							Select your folder : 
							<select bind:value={selectedFolder}>
								{#each folders as folder}
									<option value={folder}>{folder.name}</option>
								{/each}
							</select>
						</p>
					{:else}
						<p>No folders found</p>
					{/if}
				</div>
				{#if selectedFolder && selectedFolder.files && selectedFolder.files.length > 0}
					<div>
						<p>Images in the folder :</p>
						{#each selectedFolder.files as file}
							{#if file.type === 'image'}
								<button
									class="text-blue-900 cursor-pointer"
									on:click={() => {
										addImages(file);
										const imageEmbedCode = OutputSrc;
										navigator.clipboard.writeText(imageEmbedCode);
										alert('Image link copied to clipboard');
									}}
								>
									{file.name}
								</button>
								<br />
							{/if}
						{/each}
						<br />
					</div>
				{/if}
				<input
					type="text"
					bind:value={uniqueSubject}
					placeholder="Email Subject"
					class="mb-2 block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
				/>
				<HtmlEditor bind:content={html} on:input={handleEditorInput}/>
				<button
					class="mt-5 focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
					on:click={sendMail}>Send</button>
			</div>
			<div class="border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
				<h2 class="text-xl font-bold mb-4">Preview</h2>
				<div class="p-4 bg-gray-100 rounded dark:bg-gray-900" style="min-height: 200px;">
					<iframe id="preview-iframe2" title="Email Preview" class="w-full h-full border-0"></iframe>
				</div>
			</div>
		</div>
	{/if}

	{#if useTemplate === true}
		<h2 class="font-bold text-lg uppercase pb-4">Template mail</h2>
		<button
			class="ml-10 text-white bg-[#6B9AD9] hover:bg-[#4f7cb7] focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
			on:click={() => (useTemplate = false)}>Use unique mail</button>
		<div class="grid-container ml-10 mb-10 pt-5">
			<div class="border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
				<h2 class="text-xl font-bold mb-4">Complete the template informations</h2>
				<p>
					Please select the template you want to use :
					<select class="m-2" bind:value={selectedTemplate}>
						{#each templates as template}
							<option value={template}>{template.name}</option>
						{/each}
					</select>
				</p>
				{#if selectedTemplate}
					<button
						class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
						on:click={sendTemplateToParticipants}>Send</button>
				{/if}
			</div>
			<div class="border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
				{#if selectedTemplate}
					<div class="m-2">
						<h2 class="text-xl font-bold mb-4">{selectedTemplate.name}</h2>
					</div>
					<iframe id="preview-iframe" title="Template Preview" class="w-full h-full border-0"></iframe>
				{:else}
					<p>Please select a template to see its content</p>
				{/if}
			</div>
		</div>
	{/if}
	</div>
	
</div>
{#if isMobile}
<ProjectPhoneDisplayer project={project} selectedTab={2}/>
{/if}


<style>
	.grid-container {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
	}

	@media (max-width: 1050px) {
		.grid-container {
			grid-template-columns: 1fr;
			margin: 0.5rem;
		}
	}
</style>