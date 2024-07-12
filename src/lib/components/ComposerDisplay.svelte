<script lang="ts">
    export let selectedComposer: Composer;
</script>


<div class="w-1/2">
    {#if selectedComposer == null}
        <span>selectionner un composer</span>
    {:else}
        <!--affichage des composers-->
        <div class="flex flex-col w-1/2 border-2 border-rose-500">
            <div class="flex justify-center border-2 border-rose-500">composer</div>
            <div class="flex flex-col p-2">
                <span>Full Name</span>
                <input
                    class="p-1"
                    bind:value={selectedComposer.longName}
                    placeholder="enter the full name"
                />
                <span>Short name</span>
                <input
                    class="p-1"
                    bind:value={selectedComposer.shortName}
                    placeholder="enter the short name"
                />
                <span>His main style</span>
                <input
                    class="p-1"
                    bind:value={selectedComposer.mainStyle}
                    placeholder="enter his main style"
                />
                <span>Country</span>
                <input class="p-1" bind:value={selectedComposer.country} placeholder="enter his country" />
                <span>Date of birth</span>
                <input
                    id="birthDate"
                    class="p-1"
                    bind:value={selectedComposer.birthDate}
                    placeholder="enter his date of birth"
                    type="date"
                />
                <span>Date of death</span>
                <input
                    id="deathDate"
                    class="p-1"
                    bind:value={selectedComposer.deathDate}
                    placeholder="enter his date of death"
                    type="date"
                />
            </div>

            <div class="flex p-2">
                {#if selectedComposer.id == null}
                    <button class="p-1 border-2 border-green-500" on:click={addComposer}> add </button>
                {:else}
                    <button class="p-1 border-2 border-orange-500" on:click={addComposer}> modify </button>
                    <button class="p-1 border-2 border-red-500" on:click={deleteComposer}> Delete </button>
                {/if}
            </div>
        </div>
    {/if}
</div>