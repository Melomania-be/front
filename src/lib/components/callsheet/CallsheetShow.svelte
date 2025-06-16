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

                <!-- Titre superposé responsive -->
                <div class="absolute top-8 sm:top-12 md:top-16 lg:top-20 left-1/2 transform -translate-x-1/2 text-center w-full px-4">
                    <h1 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white drop-shadow-md break-words">
                        CALLSHEET - {callsheet.project.name}
                    </h1>
                </div>

                <!-- Conteneur blanc responsive -->
                <div class="absolute top-[120px] sm:top-[140px] md:top-[160px] lg:top-[180px] left-1/2 transform -translate-x-1/2 w-full px-2">
                    <div class="bg-white dark:bg-gray-900 shadow-md rounded-xl px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-4xl mx-auto">
                        <!-- Program Section -->
                        <div class="mb-4 sm:mb-6">
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
            <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mt-8 sm:mt-10">
                Callsheet last updated on {new Date(callsheet.updatedAt).toLocaleString()}
            </div>
        </div>
    {:else}
        <p class="text-center text-gray-800 dark:text-white">
            We encountered a problem retrieving the call sheet. Please reload the page or try again later.
        </p>
    {/if}
</div>

<style>
    /* Amélioration pour les très petits écrans */
    @media (max-width: 360px) {
        h1 {
            font-size: 0.9rem !important;
            line-height: 1.2 !important;
        }
    }

    @media (max-width: 320px) {
        h1 {
            font-size: 0.8rem !important;
            line-height: 1.1 !important;
        }
    }
</style>