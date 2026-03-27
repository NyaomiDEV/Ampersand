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

	import { formatDate } from "../lib/util/misc";
	import DatePopupPicker from "../components/DatePopupPicker.vue";

	const model = defineModel<{
		range: number,
		date: Date
	}>({
		default: {
			range: 0,
			date: new Date()
		}
	});

	async function confirm(){
		await modalController.dismiss("confirmed");
	}
</script>

<template>
	<IonModal class="presence-edit-modal">
		<IonList>
			<IonItem>
				<IonRange
					v-model="model.range"
					:label="$t('frontHistory:edit.presence.addTitle')"
					label-placement="stacked"
					:min="0"
					:max="10"
					:step="1"
					:snaps="true"
					:ticks="false"
					:pin="true"
					:pin-formatter="(v) => `${Math.round(v)}`"
				/>
			</IonItem>
			<IonItem button :detail="true" @click="($refs.datePicker as any)?.$el.present()">
				<IonLabel>
					<h2>{{ $t("frontHistory:edit.presence.date") }}</h2>
					<p>{{ formatDate(model.date, "expanded") }}</p>
				</IonLabel>
				<DatePopupPicker
					ref="datePicker"
					v-model="model.date"
					show-default-buttons
					:title="$t('frontHistory:edit.presence.date')"
				/>
			</IonItem>
		</IonList>
		<IonButton @click="confirm">
			{{ $t("frontHistory:edit.presence.confirmButton") }}
		</IonButton>
	</IonModal>
</template>

<style scoped>
	.presence-edit-modal {
		--border-radius: 16px;
		--height: fit-content;
	}

	.presence-edit-modal::part(content) {
		padding: 8px 0px 16px 0px;
		box-sizing: border-box;
	}

	ion-button {
		margin-inline: 16px;
	}
</style>
