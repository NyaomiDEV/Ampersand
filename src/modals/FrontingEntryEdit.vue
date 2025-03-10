<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonIcon,
		IonList,
		IonFab,
		IonFabButton,
		IonLabel,
		IonToggle,
		IonInput,
		IonItem,
		modalController,
		IonModal,
		alertController
	} from "@ionic/vue";

	import {
		saveOutline as saveIOS,
		trashBinOutline as trashIOS
	} from "ionicons/icons";

	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { FrontingEntryComplete } from "../lib/db/entities";
	import { newFrontingEntry, updateFrontingEntry, deleteFrontingEntry } from '../lib/db/tables/frontingEntries';
	import { inject, ref, toRaw, useTemplateRef } from "vue";

	import MemberSelect from "./MemberSelect.vue";
	import MemberAvatar from "../components/member/MemberAvatar.vue";
	import DatePopupPicker from "../components/DatePopupPicker.vue";
	import ContentEditable from "../components/ContentEditable.vue";

	import { PartialBy } from "../lib/types";
	import { formatDate } from "../lib/util/misc";
	import { useTranslation } from "i18next-vue";


	const i18next = useTranslation();
	const isIOS = inject<boolean>("isIOS");

	const props = defineProps<{
		frontingEntry?: PartialBy<FrontingEntryComplete, "uuid" | "member">
	}>();

	const emptyFrontingEntry: PartialBy<FrontingEntryComplete, "uuid" | "member"> = {
		isMainFronter: false,
		startTime: new Date(),
		endTime: new Date(),
	};
	const frontingEntry = ref({...(props.frontingEntry || emptyFrontingEntry)});

	const memberSelectModal = useTemplateRef("memberSelectModal");

	async function save(){
		const uuid = frontingEntry.value?.uuid;
		const _frontingEntry = toRaw(frontingEntry.value);

		if(!_frontingEntry.member) return;

		if(!uuid) {
			await newFrontingEntry({..._frontingEntry, member: _frontingEntry.member.uuid });

			await modalController.dismiss(null, "added");

			return;
		}

		await updateFrontingEntry(uuid, {
			..._frontingEntry,
			member: _frontingEntry.member.uuid
		});

		try{
			await modalController.dismiss(null, "modified");
		}catch(_){}
		// catch an error because the type might get changed, causing the parent to be removed from DOM
		// however it's safe for us to ignore
	}

	function promptDeletion(): Promise<boolean> {
		return new Promise(async (resolve) => {
			const alert = await alertController.create({
				header: i18next.t("frontHistory:edit.delete.title"),
				subHeader: i18next.t("frontHistory:edit.delete.confirm"),
				buttons: [
					{
						text: i18next.t("other:alerts.cancel"),
						role: "cancel",
						handler: () => resolve(false)
					},
					{
						text: i18next.t("other:alerts.ok"),
						role: "confirm",
						handler: () => resolve(true)
					}
				]
			});

			await alert.present();
		});
	}

	async function removeFrontingEntry(){
		if(await promptDeletion()){
			await deleteFrontingEntry(frontingEntry.value.uuid!);
			try{
				await modalController.dismiss(undefined, "deleted");
			}catch(_){}
		}
	}

	function removeFromFront() {
		frontingEntry.value.endTime = new Date();
	}
</script>

<template>
	<IonModal class="fronting-entry-edit-modal" :breakpoints="[0,1]" initialBreakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("frontHistory:edit.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList inset>
					<IonItem button @click="memberSelectModal?.$el.present()">
						<template v-if="frontingEntry.member">
							<MemberAvatar slot="start" :member="frontingEntry.member" />
							<IonLabel>
								<h2>{{ frontingEntry.member.name }}</h2>
								<p>{{ $t("frontHistory:edit.member") }}</p>
							</IonLabel>
						</template>
						<template v-else>
							<IonLabel>
								<h2>{{ $t("frontHistory:edit.member") }}</h2>
							</IonLabel>
						</template>
					</IonItem>
					<IonItem>
						<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('frontHistory:edit.customStatus')" labelPlacement="floating" v-model="frontingEntry.customStatus" />
					</IonItem>
					<IonItem>
						<ContentEditable :label="$t('frontHistory:edit.comment')" v-model="frontingEntry.comment" />
					</IonItem>
					<IonItem button @click="($refs.startTimePicker as any)?.$el.present()">
						<IonLabel>
							<h2>{{ $t("frontHistory:edit.startTime") }}</h2>
							<p>{{ formatDate(frontingEntry.startTime, "expanded") }}</p>
						</IonLabel>
						<DatePopupPicker
							v-model="frontingEntry.startTime"
							showDefaultButtons
							ref="startTimePicker"
							:title="$t('frontHistory:edit.startTime')"
							:max="frontingEntry.endTime || new Date()"
						/>
					</IonItem>
					<IonItem button v-if="!frontingEntry.endTime" @click="removeFromFront">
						<IonLabel>
							<h2>{{ $t("frontHistory:edit.removeFromFront.title") }}</h2>
							<p>{{ $t("frontHistory:edit.removeFromFront.desc") }}</p>
						</IonLabel>
					</IonItem>
					<IonItem button v-if="frontingEntry.endTime" @click="($refs.endTimePicker as any)?.$el.present()">
						<IonLabel>
							<h2>{{ $t("frontHistory:edit.endTime") }}</h2>
							<p>{{ formatDate(frontingEntry.endTime, "expanded") }}</p>
						</IonLabel>
						<DatePopupPicker
							v-model="frontingEntry.endTime"
							showDefaultButtons
							ref="endTimePicker"
							:title="$t('frontHistory:edit.endTime')"
							:min="frontingEntry.startTime"
						/>
					</IonItem>
					<IonItem button detail="false">
						<IonToggle v-model="frontingEntry.isMainFronter">
							<IonLabel>
								{{ $t("frontHistory:edit.isMainFronter") }}
							</IonLabel>
						</IonToggle>
					</IonItem>
					<IonItem button detail="false" v-if="frontingEntry.uuid" @click="removeFrontingEntry">
						<IonIcon :ios="trashIOS" :md="trashMD" slot="start" aria-hidden="true" color="danger"/>
						<IonLabel color="danger">
							<h3>{{ $t("frontHistory:edit.delete.title") }}</h3>
							<p>{{ $t("other:genericDeleteDesc") }}</p>
						</IonLabel>
					</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save" v-if="frontingEntry.member">
					<IonIcon :ios="saveIOS" :md="saveMD" />
				</IonFabButton>
			</IonFab>

			<MemberSelect
				:onlyOne="true"
				:discardOnSelect="true"
				:hideCheckboxes="true"
				:modelValue="frontingEntry.member ? [frontingEntry.member] : []"
				@update:modelValue="(e) => { if(e[0]) frontingEntry.member = e[0] }"
				ref="memberSelectModal"
			/>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	ion-modal.fronting-entry-edit-modal {
		--height: 50dvh;
		--min-height: 600px;
		--border-radius: 16px;
	}
</style>