<script lang="ts">
  import { Pie } from 'svelte-chartjs';
  import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

  ChartJS.register(ArcElement, Tooltip, Legend);

  export let data;
  export let options;
</script>

<div class="w-full h-full">
  <Pie {data} {options} />
</div>