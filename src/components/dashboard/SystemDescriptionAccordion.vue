<script setup lang="ts">
	import { IonAccordionGroup, IonAccordion, IonItem, IonLabel } from "@ionic/vue";
	import { onBeforeMount, ref } from "vue";

	import downMD from "@material-symbols/svg-600/outlined/arrow_drop_down.svg";

	import { getSystem } from "../../lib/db/tables/system";
	import Markdown from "../Markdown.vue";

	const description = ref("");

	onBeforeMount(async () => {
		const _description = (await getSystem())?.description;
		if(_description) description.value = _description;
	});
</script>

<template>
	<IonAccordionGroup v-if="description && description.length">
		<IonAccordion value="systemInfo" :toggle-icon="downMD">
			<IonItem slot="header">
				<IonLabel>{{ $t("dashboard:systemDescription") }}</IonLabel>
			</IonItem>
			<div slot="content" class="ion-padding">
				<Markdown :markdown="description" />
			</div>
		</IonAccordion>
	</IonAccordionGroup>
</template>

<style scoped>
	ion-accordion {
		background-color: inherit;
	}
</style>