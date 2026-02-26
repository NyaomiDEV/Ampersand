<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonList,
		IonItem,
		IonModal,
		IonLabel,
		IonFab,
		IonFabButton,
		IonIcon,
		IonButton,
	} from "@ionic/vue";

	import { formatDate } from "../lib/util/misc";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { ref, useTemplateRef } from "vue";
	import PresenceAdd from "./PresenceAdd.vue";
	import PresenceRating from "../components/PresenceRating.vue";
	import { useTranslation } from "i18next-vue";

	const i18next = useTranslation();

	const props = defineProps<{
		modelValue?: Map<Date, number>
	}>();

	const emit = defineEmits<{
		"update:modelValue": [Map<Date, number>],
	}>();

	const presence = ref<Map<Date, number>>(props.modelValue || new Map());

	const presenceAddModal = useTemplateRef("presenceAddModal");

	function presencePhrase(rating: number): string {
		switch (rating) {
			case 0:
				return i18next.t("other:presence.absent");
			case 1:
			case 2:
				return i18next.t("other:presence.heavilyDissociating");
			case 3:
			case 4:
				return i18next.t("other:presence.dissociating");
			case 5:
			case 6:
				return i18next.t("other:presence.zonedOut");
			case 7:
			case 8:
				return i18next.t("other:presence.present");
			case 9:
			case 10:
				return i18next.t("other:presence.fullyGrounded");
		}
		return "";
	}
</script>

<template>
	<IonModal
		class="presence-history-modal"
		:breakpoints="[0,0.75,1]"
		initial-breakpoint="1"
		@did-dismiss="emit('update:modelValue', presence)"
	>
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("frontHistory:edit.presence.historyTitle") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList>
				<IonItem
					v-for="entry in Array.from(presence.entries()).sort((a, b) => b[0].valueOf() - a[0].valueOf())"
					:key="entry[0].valueOf()"
				>
					<IonLabel>
						<p>{{ formatDate(entry[0], "expanded") }}</p>
						<h2>{{ presencePhrase(entry[1]) }}</h2>
						<h2><PresenceRating :rating="entry[1]" /></h2>
					</IonLabel>
					<IonButton
						slot="end"
						shape="round"
						fill="outline"
						size="default"
						@click="(e) => { e.stopPropagation(); presence.delete(entry[0]) }"
					>
						<IonIcon
							slot="icon-only"
							:icon="trashMD"
							color="danger"
						/>
					</IonButton>
				</IonItem>
			</IonList>
		</IonContent>

		<IonFab slot="fixed" vertical="bottom" horizontal="end">
			<IonFabButton @click="presenceAddModal?.$el.present()">
				<IonIcon :icon="addMD" />
			</IonFabButton>
		</IonFab>

		<PresenceAdd ref="presenceAddModal" @add="(date, p) => presence.set(date, p)" />
	</IonModal>
</template>

<style scoped>
	.presence-history-modal {
		--max-height: 75%;
	}
</style>