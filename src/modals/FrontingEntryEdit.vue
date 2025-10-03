<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonIcon,
		IonList,
		IonFab,
		IonButton,
		IonFabButton,
		IonLabel,
		IonToggle,
		IonInput,
		IonItem,
		modalController,
		IonModal,
	} from "@ionic/vue";

	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { FrontingEntryComplete } from "../lib/db/entities";
	import { newFrontingEntry, updateFrontingEntry, deleteFrontingEntry, sendFrontingChangedEvent } from "../lib/db/tables/frontingEntries";
	import { ref, toRaw, useTemplateRef } from "vue";

	import MemberSelect from "./MemberSelect.vue";
	import MemberAvatar from "../components/member/MemberAvatar.vue";
	import DatePopupPicker from "../components/DatePopupPicker.vue";
	import ContentEditable from "../components/ContentEditable.vue";

	import { PartialBy } from "../lib/types";
	import { formatDate, promptOkCancel } from "../lib/util/misc";
	import { useTranslation } from "i18next-vue";


	const i18next = useTranslation();

	const props = defineProps<{
		frontingEntry?: PartialBy<FrontingEntryComplete, "uuid" | "member">
	}>();

	const emptyFrontingEntry: PartialBy<FrontingEntryComplete, "uuid" | "member"> = {
		isMainFronter: false,
		startTime: new Date(),
		endTime: new Date(),
		isLocked: false
	};
	const frontingEntry = ref({...(props.frontingEntry || emptyFrontingEntry)});

	const memberSelectModal = useTemplateRef("memberSelectModal");
	const memberInfluencingModal = useTemplateRef("memberInfluencingModal");
	const memberTagModal = useTemplateRef("memberTagModal");

	async function save(){
		const uuid = frontingEntry.value?.uuid;
		const _frontingEntry = toRaw(frontingEntry.value);

		if(!_frontingEntry.member) return;

		if(_frontingEntry.isMainFronter)
			_frontingEntry.influencing = undefined;

		if(!uuid) {
			await newFrontingEntry({..._frontingEntry, member: _frontingEntry.member.uuid, influencing: _frontingEntry.influencing?.uuid });
			await sendFrontingChangedEvent();

			await modalController.dismiss(null, "added");

			return;
		}

		await updateFrontingEntry(uuid, {
			..._frontingEntry,
			member: _frontingEntry.member.uuid,
			influencing: _frontingEntry.influencing?.uuid
		});
		await sendFrontingChangedEvent();

		try{
			await modalController.dismiss(null, "modified");
		}catch(_){ /* empty */ }
		// catch an error because the type might get changed, causing the parent to be removed from DOM
		// however it's safe for us to ignore
	}

	async function removeFrontingEntry(){
		if(await promptOkCancel(
			i18next.t("frontHistory:edit.delete.title"),
			i18next.t("frontHistory:edit.delete.confirm"),
		)){
			await deleteFrontingEntry(frontingEntry.value.uuid!);
			await sendFrontingChangedEvent();

			try{
				await modalController.dismiss(undefined, "deleted");
			}catch(_){ /* empty */ }
		}
	}

	function removeFromFront() {
		frontingEntry.value.endTime = new Date();
	}
</script>

<template>
	<IonModal class="fronting-entry-edit-modal" :breakpoints="[0,1]" initial-breakpoint="1">
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
					<IonInput
						v-model="frontingEntry.customStatus"
						fill="outline"
						:label="$t('frontHistory:edit.customStatus')"
						label-placement="floating"
					/>
				</IonItem>
				<IonItem v-if="!frontingEntry.isMainFronter" button @click="memberInfluencingModal?.$el.present()">
					<template v-if="frontingEntry.influencing">
						<MemberAvatar slot="start" :member="frontingEntry.influencing" />
						<IonLabel>
							<p>{{ $t("frontHistory:edit.influencing.currentlyInfluencing") }}</p>
							<h2>{{ frontingEntry.influencing.name }}</h2>
						</IonLabel>
					</template>
					<template v-else>
						<IonLabel>
							<h2>{{ $t("frontHistory:edit.influencing.select") }}</h2>
						</IonLabel>
					</template>
					<IonButton
						v-if="frontingEntry.influencing"
						slot="end"
						shape="round"
						fill="outline"
						size="default"
						@click="(e) => { e.stopPropagation(); frontingEntry.influencing = undefined }"
					>
						<IonIcon
							slot="icon-only"
							:icon="trashMD"
							color="danger"
						/>
					</IonButton>
				</IonItem>
				<IonItem button @click="($refs.startTimePicker as any)?.$el.present()">
					<IonLabel>
						<h2>{{ $t("frontHistory:edit.startTime") }}</h2>
						<p>{{ formatDate(frontingEntry.startTime, "expanded") }}</p>
					</IonLabel>
					<DatePopupPicker
						ref="startTimePicker"
						v-model="frontingEntry.startTime"
						show-default-buttons
						:title="$t('frontHistory:edit.startTime')"
						:max="frontingEntry.endTime || new Date()"
					/>
				</IonItem>
				<IonItem v-if="!frontingEntry.endTime" button @click="removeFromFront">
					<IonLabel>
						{{ $t("frontHistory:edit.removeFromFront") }}
					</IonLabel>
				</IonItem>
				<IonItem v-else button @click="($refs.endTimePicker as any)?.$el.present()">
					<IonLabel>
						<h2>{{ $t("frontHistory:edit.endTime") }}</h2>
						<p>{{ formatDate(frontingEntry.endTime, "expanded") }}</p>
					</IonLabel>
					<DatePopupPicker
						ref="endTimePicker"
						v-model="frontingEntry.endTime"
						show-default-buttons
						:title="$t('frontHistory:edit.endTime')"
						:min="frontingEntry.startTime"
					/>
					<IonButton
						slot="end"
						shape="round"
						fill="outline"
						size="default"
						@click="(e) => { e.stopPropagation(); frontingEntry.endTime = undefined }"
					>
						<IonIcon
							slot="icon-only"
							:icon="trashMD"
							color="danger"
						/>
					</IonButton>
				</IonItem>
				<IonItem button :detail="false">
					<IonToggle v-model="frontingEntry.isMainFronter">
						<IonLabel>
							{{ $t("frontHistory:edit.isMainFronter") }}
						</IonLabel>
					</IonToggle>
				</IonItem>
				<IonItem button :detail="false">
					<IonToggle v-model="frontingEntry.isLocked">
						<IonLabel>
							{{ $t("frontHistory:edit.isLocked") }}
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<ContentEditable v-model="frontingEntry.comment" :label="$t('frontHistory:edit.comment')" />
				</IonItem>

				<IonItem>
					<IonButton fill="clear" @click="frontingEntry.comment += '<t:' + Math.floor(Date.now() / 1000) + ':f>'">
						{{ $t("other:addTimestamp") }}
					</IonButton>
					<IonButton fill="clear" @click="memberTagModal?.$el.present()">
						{{ $t("other:memberMention") }}
					</IonButton>
				</IonItem>

				<IonItem
					v-if="frontingEntry.uuid"
					button
					:detail="false"
					@click="removeFrontingEntry"
				>
					<IonIcon
						slot="start"
						:icon="trashMD"
						aria-hidden="true"
						color="danger"
					/>
					<IonLabel color="danger">
						<h3>{{ $t("frontHistory:edit.delete.title") }}</h3>
						<p>{{ $t("other:genericDeleteDesc") }}</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton v-if="frontingEntry.member" @click="save">
					<IonIcon :icon="saveMD" />
				</IonFabButton>
			</IonFab>

			<MemberSelect
				ref="memberSelectModal"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="true"
				:model-value="frontingEntry.member ? [frontingEntry.member] : []"
				@update:model-value="(e) => { if(e[0]) frontingEntry.member = e[0] }"
			/>

			<MemberSelect
				ref="memberInfluencingModal"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="true"
				:model-value="frontingEntry.influencing ? [frontingEntry.influencing] : []"
				@update:model-value="(e) => { if(e[0]) frontingEntry.influencing = e[0] }"
			/>

			<MemberSelect
				ref="memberTagModal"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="true"
				:model-value="frontingEntry.member ? [frontingEntry.member] : []"
				@update:model-value="(e) => { if(e[0] && frontingEntry.comment) frontingEntry.comment += '@<m:'+ e[0].uuid +'>' }"
			/>
		</IonContent>
	</IonModal>
</template>
