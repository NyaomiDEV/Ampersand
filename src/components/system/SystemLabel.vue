<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { System } from "../../lib/db/entities";

	const props = defineProps<{
		system: System
	}>();
</script>

<template>
	<IonLabel class="nowrap">
		<slot name="before" />
		<h2>
			{{ props.system.name }}
		</h2>
		<slot />
	</IonLabel>
</template>
