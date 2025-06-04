<!-- <script lang="ts">
    import '../app.css';
    import { page } from '$app/stores';
    import Fa from 'svelte-fa';
    import { 
        faProjectDiagram, 
        faAddressBook,
        faUsers,
        faEnvelope,
        faFolderTree,
        faMusic,
        faGuitar,
        faSignOutAlt,
		faPersonDigging
    } from '@fortawesome/free-solid-svg-icons';

    export let data;

    $: currentPath = $page.url.pathname;

    const menu = [
		// Not used for now
		// { icon: faPersonDigging, text: 'call-sheets', href: '/call_sheets' },
		// { icon: faPersonDigging, text: 'registration', href: '/registration' },
		// { icon: faPersonDigging, text: 'recommendation', href: '/recommendation/1' },
        { icon: faProjectDiagram, text: 'Projects', href: '/projects' },
        { icon: faAddressBook, text: 'Contacts', href: '/contacts' },
        { icon: faUsers, text: 'Users', href: '/users' },
        { icon: faEnvelope, text: 'Mailing', href: '/mailing' },
        { icon: faFolderTree, text: 'Files', href: '/files' },
        { icon: faMusic, text: 'Composer and pieces', href: '/library' },
        { icon: faGuitar, text: 'Sections and instruments', href: '/sectionGroups' },
        { icon: faSignOutAlt, text: 'Log out', href: '/api/sign_out' }
    ];

    function toggleMenu() {
        const navbar = document.getElementById('navbar-default');
        if (navbar) {
            navbar.classList.toggle('hidden');
        }
    }
</script>

<style>
    .nav-item {
        display: flex;
        align-items: center;
        padding: 0.4rem 0.5rem;
        margin: 0.1rem;
        border-radius: 1px;
        transition: background-color 0.3s, color 0.3s;
        text-decoration: none;
        color: #333;
    }

    .nav-item:hover {
        background-color: #e2e6ea;
    }

    .variant-soft-primary {
        background-color: #007bff;
        color: #fff;
    }

    .variant-soft-primary:hover {
        background-color: #0056b3;
    }

    .nav-item span {
        margin-left: 0.5rem;
    }

    .navbar-container {
        align-items: center;
    }

    @media (min-width: 1050px) {
        .navbar-menu {
            flex-direction: row;
            justify-content: space-between;
        }
    }
</style>

{#if data.connected}
    <nav class="bg-white border-gray-200 dark:bg-gray-900">
        <div class="max-w-screen-xl mx-auto p-4 navbar-container">
            <button 
                data-collapse-toggle="navbar-default" 
                type="button" 
                class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" 
                aria-controls="navbar-default" 
                aria-expanded="false"
                on:click={toggleMenu}
            >
                <span class="sr-only">Open main menu</span>
                <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h15M1 7h15M1 13h15"/>
                </svg>
            </button>
            <div class="hidden w-full lg:block lg:w-auto" id="navbar-default">
                <ul class="font-medium flex flex-col p-4 lg:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 lg:flex-row lg:space-x-8 rtl:space-x-reverse lg:mt-0 lg:border-0 lg:bg-white dark:bg-gray-800 lg:dark:bg-gray-900 dark:border-gray-700">
                    {#each menu as item}
                        <li>
                            <a
                                href={item.href}
                                class="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 lg:hover:bg-transparent lg:border-0 lg:hover:text-blue-700 lg:p-0 dark:text-white lg:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent nav-item"
                                class:variant-soft-primary={currentPath === item.href}
                                class:variant-soft={currentPath !== item.href}
                            >
                                <Fa icon={item.icon} />
                                <span>{item.text}</span>
                            </a>
                        </li>
                    {/each}
                </ul>
            </div>
        </div>
    </nav>
{/if}

<slot /> -->





<!-- chatgpt -->
<script lang="ts">
    import '../app.css';
    import { page } from '$app/stores';
    import Fa from 'svelte-fa';
    import {
        faProjectDiagram, 
        faAddressBook,
        faUsers,
        faEnvelope,
        faFolderTree,
        faMusic,
        faGuitar,
        faSignOutAlt
    } from '@fortawesome/free-solid-svg-icons';

    export let data;

    $: currentPath = $page.url.pathname;

    const menu = [
        { icon: faProjectDiagram, text: 'Projects', href: '/projects' },
        { icon: faAddressBook, text: 'Contacts', href: '/contacts' },
        { icon: faUsers, text: 'Users', href: '/users' },
        { icon: faEnvelope, text: 'Mailing', href: '/mailing' },
        { icon: faFolderTree, text: 'Files', href: '/files' },
        { icon: faMusic, text: 'Composer and pieces', href: '/library' },
        { icon: faGuitar, text: 'Sections and instruments', href: '/sectionGroups' },
        { icon: faSignOutAlt, text: 'Log out', href: '/api/sign_out' }
    ];

    let showSidebar = false;

    function toggleSidebar() {
        showSidebar = !showSidebar;
    }
</script>

{#if data.connected}
<div class="flex h-screen  bg-gray-100 dark:bg-gray-900">
    <!-- Sidebar -->
    <aside class={`fixed top-0 left-0 z-40 w-64 h-full transition-transform ${showSidebar ? '' : '-translate-x-full'} sm:translate-x-0 bg-gradient-to-t from-[#343CAD] to-[#6BB0C7] dark:bg-gray-800 border-r dark:border-gray-700`}>
        <div class="h-full overflow-y-auto px-3 py-4">
            <h2 class="text-xl font-bold dark:text-gray-800  text-white mb-6 px-2">Melomania</h2>
            <ul class="space-y-2">
                {#each menu as item}
                    <li>
                        <a 
                            href={item.href}
                            class="flex items-center p-2 text-white font-medium dark:text-gray-300 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 transition-all"
                            class:bg-blue-600={currentPath === item.href}
                            class:dark:bg-blue-700={currentPath === item.href}
                            class:text-blue-700={currentPath === item.href}
                            class:dark:text-white={currentPath === item.href}
                        >
                            <Fa icon={item.icon} class="w-5 h-5" />
                            <span class="ml-3">{item.text}</span>
                        </a>
                    </li>
                {/each}
            </ul>
        </div>
    </aside>

    <!-- Mobile backdrop to close sidebar -->
    {#if showSidebar}
        <div 
            class="fixed inset-0 z-30 bg-black bg-opacity-50 sm:hidden"
            on:click={toggleSidebar}
        ></div>
    {/if}

    <!-- Main content -->
    <div class="bg-[#E7E7E7] flex-1 ml-0 sm:ml-64">
        <!-- Mobile toggle button -->
        <button 
            class="sm:hidden p-2 text-gray-500 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            on:click={toggleSidebar}
        >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>

        <slot />
    </div>
</div>
{:else}
<slot />
{/if}









