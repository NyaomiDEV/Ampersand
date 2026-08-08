<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { System } from "../../lib/db/entities";
	import { getCustomName } from "../../lib/util/misc";

	const props = defineProps<{
		system: System
	}>();
</script>

<template>
	<IonLabel class="nowrap">
		<slot name="before" />
		<h2>
			{{ getCustomName(props.system) }}
		</h2>
		<slot />
	</IonLabel>
</template>
