<script lang="ts">
	import type { Callsheet } from '$lib/types/Callsheet';
	import type { File } from '$lib/types/File';

	export let callsheet: Callsheet;

	async function downloadFile(file: File) {
		const response = await fetch(`/api/files/${file.id}`, {
			method: 'GET'
		});

		if (response.status >= 400 && response.status < 500) {
			const jsonResponse = await response.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		}

		if (response.status >= 500) {
			alert('Server error');
		}

		if (response.status === 200) {
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');

			a.href = window.URL.createObjectURL(
				new Blob([blob], {
					type: file.type
				})
			);
			a.download = file.name;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);

			document.body.removeChild(a);
		}
	}
</script>

<div class="flex flex-col m-1 border-2 border-rose-500">
	<h1>CALL SHEET</h1>
	{#if callsheet}
		<p><b>Version :</b> {callsheet.version}</p>
		<p><b>Project Name :</b> {callsheet.project.name || 'No project name?'}</p>

		<div>
			<p><b>Contents</b></p>
			{#if callsheet.contents.length === 0}
				<p>No content found</p>
			{:else}
				{#each callsheet.contents as content}
					<div>
						<p class="uppercase">{content.title}</p>
						<p>{@html content.text}</p>
					</div>
				{/each}
			{/if}
		</div>

		<p><b>Rehearsals</b></p>
		{#if callsheet.project?.rehearsals}
			<table>
				<thead>
					<tr>
						<th>Date</th>
						<th>Place</th>
						<th>Comment</th>
					</tr>
				</thead>
				<tbody>
					{#if callsheet.project.rehearsals.length === 0}
						<tr>
							<td colspan="3">No rehearsal found</td>
						</tr>
					{:else}
						{#each callsheet.project.rehearsals as rehearsal}
							<tr>
								<td>{rehearsal.date}</td>
								<td>{rehearsal.place}</td>
								<td>{rehearsal.comment}</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		{:else}
			<p>No rehearsal information available</p>
		{/if}

		<p><b>Pieces</b></p>
		{#if callsheet.project?.pieces}
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Opus</th>
						<th>Composer</th>
						<th>Arranger</th>
						<th>Files</th>
					</tr>
				</thead>
				<tbody>
					{#if callsheet.project.pieces.length === 0}
						<tr>
							<td colspan="4">No piece found</td>
						</tr>
					{:else}
						{#each callsheet.project.pieces as piece}
							<tr>
								<td>{piece.name}</td>
								<td>{piece.opus}</td>
								<td>{piece.composer.shortName}</td>
								<td>{piece.arranger ? piece.arranger : 'None'}</td>
								{#if piece.folder && piece.folder.files.length > 0}
									<table>
										{#each piece.folder.files as file}
											<tr>
												<td>{file.name}</td>
												<td
													><button
														on:click={() => downloadFile(file)}
														class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
														>Download</button
													>
												</td>
											</tr>
										{/each}
									</table>
								{/if}
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		{:else}
			<p>No pieces found</p>
		{/if}

		<p><b>Section Informations</b></p>
		{#if callsheet.project?.sectionGroup}
			<div>
				<div class="text-red-500">
					<b>Section Group Name:</b>
					{callsheet.project.sectionGroup.name}
				</div>
				{#if !callsheet.project.sectionGroup.sections || callsheet.project.sectionGroup.sections.length === 0}
					<p>No section found</p>
				{:else}
					{#each callsheet.project.sectionGroup.sections as section}
						<div>
							<p><b>Section Name:</b> {section.name}</p>
							<p><b>Size:</b> {section.size}</p>
							<p><b>Instruments:</b></p>
							<ul>
								{#if !section.instruments || section.instruments.length === 0}
									<li>No instrument found</li>
								{:else}
									{#each section.instruments as instrument}
										<li>{instrument.name}</li>
									{/each}
								{/if}
							</ul>
						</div>
					{/each}
				{/if}
			</div>
		{:else}
			<p>No section found</p>
		{/if}
	{/if}
</div>
