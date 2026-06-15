<script lang="ts">
	import type { Piece } from '$lib/types/Piece';

	export let pieces: Piece[] = [];
	export let selectedPieces: Piece[] = [];
	export let allowModification = true;

	let draggedPieceId: number | null = null;
	let dragSource: 'available' | 'selected' | null = null;

	$: selectedIds = new Set(selectedPieces.map((piece) => Number(piece.id)));
	$: availablePieces = pieces.filter((piece) => !selectedIds.has(Number(piece.id)));

	function getPieceById(pieceId: number) {
		return pieces.find((piece) => Number(piece.id) === pieceId);
	}

	function startDragging(piece: Piece, source: 'available' | 'selected') {
		if (!allowModification) return;
		draggedPieceId = Number(piece.id);
		dragSource = source;
	}

	function endDragging() {
		draggedPieceId = null;
		dragSource = null;
	}

	function moveDraggedPieceToSelected(targetIndex?: number) {
		if (draggedPieceId === null) return;

		const draggedPiece = getPieceById(draggedPieceId);
		if (!draggedPiece) {
			endDragging();
			return;
		}

		const nextSelectedPieces = selectedPieces.filter(
			(piece) => Number(piece.id) !== draggedPieceId
		);
		const safeIndex =
			targetIndex === undefined
				? nextSelectedPieces.length
				: Math.max(0, Math.min(targetIndex, nextSelectedPieces.length));

		nextSelectedPieces.splice(safeIndex, 0, draggedPiece);
		selectedPieces = nextSelectedPieces;
		endDragging();
	}

	function removeDraggedPieceFromSelected() {
		if (draggedPieceId === null) return;
		selectedPieces = selectedPieces.filter((piece) => Number(piece.id) !== draggedPieceId);
		endDragging();
	}

	function handleDropToSelected(targetIndex?: number) {
		if (!allowModification || draggedPieceId === null) return;
		moveDraggedPieceToSelected(targetIndex);
	}

	function handleDropToAvailable() {
		if (!allowModification || draggedPieceId === null) return;
		if (dragSource === 'selected') {
			removeDraggedPieceFromSelected();
			return;
		}
		endDragging();
	}
</script>

<div class="flex gap-4 items-end">
	<div class="flex-1">
		<h4 class="text-lg top-0 text-center bg-white">Available pieces</h4>
		<section
			role="list"
			class="list p-1 min-h-[300px] max-h-[300px] border border-black overflow-y-auto"
			on:dragover|preventDefault
			on:drop|preventDefault={handleDropToAvailable}
		>
			{#if availablePieces.length === 0}
				<div class="flex min-h-[288px] items-center justify-center text-gray-500">
					No pieces available
				</div>
			{:else}
				{#each availablePieces as piece (Number(piece.id))}
					<div
						role="listitem"
						class="item p-2 mb-2 border border-gray-300 rounded bg-white {allowModification
							? 'cursor-grab'
							: ''}"
						draggable={allowModification}
						on:dragstart={() => startDragging(piece, 'available')}
						on:dragend={endDragging}
					>
						{piece.name} - {piece.composer.shortName}
					</div>
				{/each}
			{/if}
		</section>
	</div>
	<div class="flex-1 mt-4 md:mt-0">
		<h4 class="text-lg text-center sticky top-0 bg-white">Selected pieces</h4>
		<section
			role="list"
			class="list p-1 min-h-[300px] max-h-[300px] border border-black overflow-y-auto"
			on:dragover|preventDefault
			on:drop|preventDefault={() => handleDropToSelected()}
		>
			{#each selectedPieces as piece, index (Number(piece.id))}
				<div
					role="listitem"
					class="item p-2 mb-2 border border-gray-300 rounded bg-white {allowModification
						? 'cursor-grab'
						: ''}"
					draggable={allowModification}
					on:dragstart={() => startDragging(piece, 'selected')}
					on:dragend={endDragging}
					on:dragover|preventDefault
					on:drop|preventDefault|stopPropagation={() => handleDropToSelected(index)}
				>
					{piece.name} - {piece.composer.shortName}
				</div>
			{/each}
		</section>
	</div>
</div>
