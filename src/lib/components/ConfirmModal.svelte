<script lang="ts">
	import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
 
import Fa from 'svelte-fa';
  export let message: string;
  export let onConfirm: () => void;
  export let onCancel: () => void;
</script>


<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-2xl shadow-xl w-[90%] max-w-md p-6 text-center space-y-6 py-10">
    <div class="flex items-center justify-center gap-5">

        <div class="text-red-500 text-xl">
            <Fa icon={faTrashAlt} />
        </div>
        <p class="text-lg text-gray-700 font-medium">{message}</p>
    </div>
    <div class="flex justify-center gap-4 mt-4">
      <button
        class="  bg-red-600 hover:bg-red-700 transition text-white font-semibold px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 w-full"
        on:click={onConfirm}
      >
        <!-- <i class="fas fa-trash-alt"></i> -->
         <Fa icon={faTrashAlt} />
        Delete
      </button>
      <button
        class="w-full bg-gray-200 hover:bg-gray-300 transition text-gray-800 font-semibold px-5 py-2.5 rounded-lg"
        on:click={onCancel}
      >
        Cancel
      </button>
    </div>
  </div>
</div>
