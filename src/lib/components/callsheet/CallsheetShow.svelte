<!-- Version améliorée sans position absolute -->
<script lang="ts">
    import type { Callsheet } from '$lib/types/Callsheet';
    import ProgramSection from './ProgramSection.svelte';
    import EventSection from './EventSection.svelte';
    import ContentSection from './ContentSection.svelte';
    import ContactSection from './ContactSection.svelte';
    import logo from '$lib/assets/image1.png';

    export let callsheet: Callsheet;

    function formatDateTime(value: string | Date) {
	    if (!value) return '';

	    const date = new Date(value);

	    return date.toLocaleString('fr-FR', {
		    timeZone: 'Europe/Paris',
		    day: '2-digit',
		    month: '2-digit',
		    year: 'numeric',
		    hour: '2-digit',
		    minute: '2-digit',
		    hour12: false
	    });
    }
</script>

<div class="relative w-full py-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 rounded-lg px-4 sm:px-6 lg:px-8">
    {#if callsheet}
        <div class="flex flex-col gap-10">
            <!-- Section avec image et contenu superposé -->
            <div class="relative">
                <!-- Image de couverture -->
                <div class="w-full h-[200px] sm:h-[280px] md:h-[350px] lg:h-[400px] xl:h-[450px]">
                    <img src={logo} alt="logo" class="w-full h-full object-cover rounded object-center" />

                    <!-- Titre superposé -->
                    <div class="absolute top-8 sm:top-12 md:top-16 lg:top-20 xl:top-24 left-1/2 transform -translate-x-1/2 text-center w-full px-4">
                        <h1 class="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white drop-shadow-md break-words">
                            CALLSHEET - {callsheet.project.name}
                        </h1>
                    </div>
                </div>

                <!-- Conteneur blanc qui chevauche l'image -->
                <div class="relative -mt-[80px] sm:-mt-[120px] md:-mt-[150px] lg:-mt-[180px] xl:-mt-[200px] mx-2 z-10">
                    <div class="content-container bg-white dark:bg-gray-900 shadow-lg rounded-xl px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-4xl mx-auto border border-white/20 backdrop-blur-sm">
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
                Callsheet last updated on {formatDateTime(callsheet.updatedAt)}
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

    /* Optimisation de l'image pour les grands écrans */
    @media (min-width: 768px) {
        img {
            object-position: center;
        }
    }

    /* Animation subtile pour le conteneur */
    .content-container {
        animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Alternatives de couleurs - décommentez celle que vous préférez */

    /* Option 1: Dégradé océan */
    /* .bg-ocean { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); } */

    /* Option 2: Dégradé sunset */
    /* .bg-sunset { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); } */

    /* Option 3: Dégradé nature */
    /* .bg-nature { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); } */

    /* Option 4: Dégradé élégant */
    /* .bg-elegant { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); } */
</style>