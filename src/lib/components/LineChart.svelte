<script lang="ts">
  import { onMount } from 'svelte';

  import type { Accounting } from '$lib/types/Accounting';
	import { faEbay } from '@fortawesome/free-brands-svg-icons';

  export let accountings: Accounting[] = [];

  let year : number = 2025;

  let emptyList = [[0,0] , [0,0] , [0,0] , [0,0] ,[0,0] , [0,0] ,[0,0] , [0,0] ,[0,0] , [0,0] ,[0,0] , [0,0]]

  let monthlyDespenses = emptyList;

  $ : if(accountings.length !== 0){
    for(const acc of accountings){
        if(acc.paymentDate){
            const paymentDate = new Date(acc.paymentDate);
            const PaymentYear = paymentDate.getFullYear();
            if(PaymentYear === year){
                const paymentMonth = paymentDate.getMonth();
                if(acc.amount < 0){
                    monthlyDespenses[paymentMonth - 1][0] += acc.amount;
                }
                else{
                    monthlyDespenses[paymentMonth - 1][1] += acc.amount;
                }
            }
        }
    }
  }

  const months = [
  'January',   // 0
  'February',  // 1
  'March',     // 2
  'April',     // 3
  'May',       // 4
  'June',      // 5
  'July',      // 6
  'August',    // 7
  'September', // 8
  'October',   // 9
  'November',  // 10
  'December'   // 11
];

</script>

{#if accountings}
  <div class="p-2 mt-2 h-auto w-full items-center flex flex-col">
    <div class="bg-red-200 flex-1 w-full gap-2 flex">
        {#each monthlyDespenses as md}
            <div class="flex-1">{md[0]}</div>
        {/each}
    </div>
    <hr class="border-2 border-gray-400 rounded-full w-full" />
    <div class="bg-green-200 flex-1 w-full gap-2 flex">
        {#each monthlyDespenses as md}
            <div class="flex-1">{md[1]}</div>
        {/each}
    </div>
  </div>
{:else}
  <p class="text-gray-500 text-sm">No data available.</p>
{/if}