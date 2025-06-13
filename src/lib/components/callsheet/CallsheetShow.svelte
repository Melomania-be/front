<!-- ... autres imports inchangés ... -->
<script lang="ts">
    import type { Callsheet } from '$lib/types/Callsheet';
    import ProgramSection from './ProgramSection.svelte';
    import EventSection from './EventSection.svelte';
    import ContentSection from './ContentSection.svelte';
    import ContactSection from './ContactSection.svelte';
    import logo from '$lib/assets/image1.png';


    export let callsheet: Callsheet;
</script>

<div class="relative w-full py-6 bg-white rounded-lg dark:bg-gray-800 px-4 sm:px-6 lg:px-8">
    {#if callsheet}
        <div class="flex flex-col gap-10">
            <!-- Image de couverture -->
            <div class="relative w-full h-[200px] sm:h-[250px] md:h-[300px]">
                <img src={logo} alt="logo" class="w-full h-full object-cover rounded" />

                <!-- Titre superposé -->
                <div class="absolute top-12 sm:top-16 md:top-20 left-1/2 transform -translate-x-1/2 text-center">
                    <h1 class="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-md">
                        CALLSHEET - {callsheet.project.name}
                    </h1>
                </div>

                <!-- Conteneur blanc responsive -->
                <div class="absolute top-[140px] sm:top-[160px] md:top-[180px] left-1/2 transform -translate-x-1/2 w-full px-2">
                    <div class="bg-white dark:bg-gray-900 shadow-md rounded-xl px-4 py-6 max-w-4xl mx-auto">
                        <!-- Program Section -->
                        <div class="mb-6">
                            <ProgramSection {callsheet} />
                        </div>

                        <!-- Events -->
                        <EventSection {callsheet} />

                        <!-- Autres sections -->
                        <ContentSection {callsheet} />
                        <ContactSection {callsheet} />
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="text-sm text-gray-600 dark:text-gray-400 text-center mt-10">
                Callsheet last updated on {new Date(callsheet.updatedAt).toLocaleString()}
            </div>
        </div>
    {:else}
        <p class="text-center text-gray-800 dark:text-white">
            We encountered a problem retrieving the call sheet. Please reload the page or try again later.
        </p>
    {/if}
</div>

