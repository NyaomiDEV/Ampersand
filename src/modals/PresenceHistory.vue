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

	import addMD from "@material-symbols/svg-600/rounded/add.svg";
	import trashMD from "@material-symbols/svg-600/rounded/delete.svg";

	import { h, ref } from "vue";
	import PresenceEdit from "./PresenceEdit.vue";
	import PresenceRating from "../components/PresenceRating.vue";
	import { addModal, removeModal } from "../lib/modals";
	import { presencePhrase } from "../lib/util/misc";
	import TheresNothingHere from "../components/TheresNothingHere.vue";

	const props = defineProps<{
		modelValue?: Map<Date, number>,
		start: Date,
		end?: Date
	}>();

	const emit = defineEmits<{
		"update:modelValue": [Map<Date, number>],
	}>();

	const presence = ref<Map<Date, number>>(props.modelValue || new Map());

	async function presentEdit(date?: Date, range?: number){
		const modelValue = { date: date || new Date(), range: range || 0 };

		const vnode = h(PresenceEdit, {
			start: props.start,
			end: props.end,
			modelValue,
			"onUpdate:modelValue": (e) => {
				modelValue.date = e.date;
				modelValue.range = e.range;
			},
			onDidDismiss: (e: CustomEvent<{ data: string }>) => {
				if(e.detail.data === "confirmed"){
					if(date)
						presence.value.delete(date);

					presence.value.set(modelValue.date, modelValue.range);
				}
				removeModal(vnode);
			}
		});

		const modal = await addModal(vnode);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
		await (modal.el as any).present();
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
			<TheresNothingHere v-if="!presence.size" />
			<IonList v-else>
				<IonItem
					v-for="entry in Array.from(presence.entries()).sort((a, b) => b[0].valueOf() - a[0].valueOf())"
					:key="entry[0].valueOf()"
					button
					@click="presentEdit(entry[0], entry[1])"
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
						size="small"
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
			<IonFabButton @click="presentEdit()">
				<IonIcon :icon="addMD" />
			</IonFabButton>
		</IonFab>
	</IonModal>
</template>

<style scoped>
	.presence-history-modal {
		--max-height: 75%;
	}
</style>