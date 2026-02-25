<script setup lang="ts">
	import { modalController } from "@ionic/core";
	import {
		IonList,
		IonItem,
		IonModal,
		IonLabel,
		IonRange,
		IonButton,
	} from "@ionic/vue";

	import { ref } from "vue";
	import { formatDate } from "../lib/util/misc";
	import DatePopupPicker from "../components/DatePopupPicker.vue";

	const range = ref(0);
	const date = ref(new Date());

	const emit = defineEmits<{
		"add": [Date, number],
	}>();

	async function add(){
		emit("add", date.value, range.value);
		await modalController.dismiss();
		range.value = 0;
	}
</script>

<template>
	<IonModal class="presence-add-modal">
		<IonList>
			<IonItem>
				<IonLabel class="more-padding">
					<h3 class="centered-text">{{ $t("frontHistory:edit.presence.addTitle") }}</h3>
					<IonRange
						v-model="range"
						:min="0"
						:max="10"
						:step="1"
						:snaps="true"
						:ticks="false"
						:pin="true"
						:pin-formatter="(v) => `${Math.round(v)}`"
					/>
				</IonLabel>
			</IonItem>
			<IonItem button :detail="true" @click="($refs.datePicker as any)?.$el.present()">
				<IonLabel>
					<h2>{{ $t("frontHistory:edit.presence.date") }}</h2>
					<p>{{ formatDate(date, "expanded") }}</p>
				</IonLabel>
				<DatePopupPicker
					ref="datePicker"
					v-model="date"
					show-default-buttons
					:title="$t('frontHistory:edit.presence.date')"
				/>
			</IonItem>
			<IonButton expand="block" fill="clear" @click="add">
				{{ $t("frontHistory:edit.presence.addButton") }}
			</IonButton>
		</IonList>
	</IonModal>
</template>

<style scoped>
	.presence-add-modal {
		--height: fit-content;
		--border-radius: 16px;
	}

	.presence-add-modal::part(content) {
		padding: 16px;
		box-sizing: border-box;
	}

	.presence-add-modal ion-item {
		--inner-padding-end: 0px;
	}
</style>
