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
	import { newFrontingEntry, updateFrontingEntry, deleteFrontingEntry, sendFrontingChangedEvent, getFrontingBetweenComplete } from "../lib/db/tables/frontingEntries";
	import { ref, toRaw, useTemplateRef, watch } from "vue";

	import MemberSelect from "./MemberSelect.vue";
	import PresenceHistory from "./PresenceHistory.vue";
	import DatePopupPicker from "../components/DatePopupPicker.vue";
	import ContentEditable from "../components/ContentEditable.vue";

	import { PartialBy } from "../lib/types";
	import { formatDate, promptOkCancel, toast } from "../lib/util/misc";
	import { useTranslation } from "i18next-vue";
	import PresenceRating from "../components/PresenceRating.vue";
	import MemberItem from "../components/member/MemberItem.vue";


	const i18next = useTranslation();

	const props = defineProps<{
		frontingEntry?: PartialBy<FrontingEntryComplete, "uuid" | "member">,
		overrideStartTime?: Date,
		overrideEndTime?: Date
	}>();

	const emptyFrontingEntry: PartialBy<FrontingEntryComplete, "uuid" | "member"> = {
		isMainFronter: false,
		startTime: props.overrideStartTime || new Date(),
		endTime: props.overrideEndTime || new Date(),
		isLocked: false
	};
	const frontingEntry = ref({ ...(props.frontingEntry || emptyFrontingEntry) });
	const allFrontingInTimeSpan = ref<FrontingEntryComplete[]>([]);

	const presenceHistoryModal = useTemplateRef("presenceHistoryModal");
	const memberSelectModal = useTemplateRef("memberSelectModal");
	const memberInfluencingModal = useTemplateRef("memberInfluencingModal");
	const memberTagModal = useTemplateRef("memberTagModal");

	async function save(dismissAfter = true){
		const uuid = frontingEntry.value?.uuid;
		const _frontingEntry = toRaw(frontingEntry.value);

		if(!_frontingEntry.member) return;

		if(_frontingEntry.isMainFronter)
			_frontingEntry.influencing = undefined;

		if(_frontingEntry.endTime)
			_frontingEntry.isLocked = false;

		try {
			if(!uuid) {
				const result = await newFrontingEntry({
					..._frontingEntry,
					member: _frontingEntry.member.uuid,
					influencing: _frontingEntry.influencing?.uuid
				});
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

				void sendFrontingChangedEvent();

				if(dismissAfter)
					await modalController.dismiss(null, "added");

				return;
			}

			const result = await updateFrontingEntry(uuid, {
				..._frontingEntry,
				member: _frontingEntry.member.uuid,
				influencing: _frontingEntry.influencing?.uuid
			});
			if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

			void sendFrontingChangedEvent();

		
			if(dismissAfter)
				await modalController.dismiss(null, "modified").catch(() => false);
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function removeFrontingEntry(){
		try{
			if(await promptOkCancel(
				i18next.t("frontHistory:edit.delete.title"),
				undefined,
				i18next.t("frontHistory:edit.delete.confirm"),
			)){
				const result = await deleteFrontingEntry(frontingEntry.value.uuid!);
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

				void sendFrontingChangedEvent();
			
				await modalController.dismiss(undefined, "deleted").catch(() => false);
			}
		}catch(e){
			await toast((e as Error).message);
		}
	}

	function removeFromFront() {
		frontingEntry.value.endTime = new Date();
	}

	function getMostRecentPresence(){
		if(!frontingEntry.value.presence) return [undefined, undefined];

		const presenceVal = Array.from(frontingEntry.value.presence.entries());

		return presenceVal.sort((a, b) => a[0].valueOf() - b[0].valueOf()).pop() || [undefined, undefined];
	}

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

	watch(frontingEntry.value, async () => {
		allFrontingInTimeSpan.value = (await getFrontingBetweenComplete(frontingEntry.value.startTime, frontingEntry.value.endTime))
			.filter(x => x.uuid !== frontingEntry.value.uuid);
	}, { immediate: true });
</script>

<template>
	<IonModal class="fronting-entry-edit-modal" :breakpoints="[0,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("frontHistory:edit.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList class="grid-2">
				<MemberItem
					v-if="frontingEntry.member"
					button
					:member="frontingEntry.member"
					:show-cover="false"
					:show-pronouns="false"
					:show-role="false"
					@click="memberSelectModal?.$el.present()"
				>
					<p>{{ $t("frontHistory:edit.member") }}</p>
				</MemberItem>
				<IonItem v-else button @click="memberSelectModal?.$el.present()">
					<IonLabel>
						<h2>{{ $t("frontHistory:edit.member") }}</h2>
					</IonLabel>
				</IonItem>
				<IonItem button @click="presenceHistoryModal?.$el.present()">
					<IonLabel>
						{{ $t("frontHistory:edit.presence.historyTitle") }}
						<p v-if="frontingEntry.presence?.size">
							{{ presencePhrase(getMostRecentPresence()[1] ?? 0) }}
							<br />
							<PresenceRating :rating="getMostRecentPresence()[1] ?? 0" />
						</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonList class="grid-2">
				<IonItem
					button
					detail
					class="take-row"
					@click="($refs.startTimePicker as any)?.$el.present()"
				>
					<IonLabel>
						<p>{{ $t("frontHistory:edit.startTime") }}</p>
						<h2>{{ formatDate(frontingEntry.startTime, "collapsed") }}</h2>
					</IonLabel>
					<DatePopupPicker
						ref="startTimePicker"
						v-model="frontingEntry.startTime"
						show-default-buttons
						:title="$t('frontHistory:edit.startTime')"
						:max="frontingEntry.endTime || new Date()"
					/>
				</IonItem>
				<IonItem
					v-if="!frontingEntry.endTime"
					button
					detail
					class="take-row"
					@click="removeFromFront"
				>
					<IonLabel>
						{{ $t("frontHistory:edit.removeFromFront") }}
					</IonLabel>
				</IonItem>
				<IonItem
					v-else
					button
					class="take-row"
					@click="($refs.endTimePicker as any)?.$el.present()"
				>
					<IonLabel>
						<p>{{ $t("frontHistory:edit.endTime") }}</p>
						<h2>{{ formatDate(frontingEntry.endTime, "collapsed") }}</h2>
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
						size="small"
						@click="(e) => { e.stopPropagation(); frontingEntry.endTime = undefined }"
					>
						<IonIcon
							slot="icon-only"
							:icon="trashMD"
							color="danger"
						/>
					</IonButton>
				</IonItem>

				<IonItem
					v-if="!frontingEntry.influencing"
					button
					:class="{ 'take-row': frontingEntry.isMainFronter }"
				>
					<IonToggle v-model="frontingEntry.isMainFronter">
						<IonLabel>
							{{ $t("frontHistory:edit.isMainFronter") }}
						</IonLabel>
					</IonToggle>
				</IonItem>

				<template v-if="!frontingEntry.isMainFronter">
					<MemberItem
						v-if="frontingEntry.influencing"
						button
						:member="frontingEntry.influencing"
						:show-cover="false"
						:show-pronouns="false"
						:show-role="false"
						:class="{ 'take-row': frontingEntry.influencing }"
						@click="memberInfluencingModal?.$el.present()"
					>
						<template #before>
							<p>{{ $t("frontHistory:edit.influencing.currentlyInfluencing") }}</p>
						</template>
						<template #end>
							<IonButton
								v-if="frontingEntry.influencing"
								slot="end"
								shape="round"
								fill="outline"
								size="small"
								@click="(e) => { e.stopPropagation(); frontingEntry.influencing = undefined }"
							>
								<IonIcon
									slot="icon-only"
									:icon="trashMD"
									color="danger"
								/>
							</IonButton>
						</template>
					</MemberItem>
					<IonItem
						v-else
						button
						:class="{ 'take-row': frontingEntry.influencing }"
						@click="memberInfluencingModal?.$el.present()"
					>
						<IonLabel>
							{{ $t("frontHistory:edit.influencing.select") }}
						</IonLabel>
					</IonItem>
				</template>
				
			</IonList>

			<IonList class="surface">
				<IonItem>
					<IonInput
						v-model="frontingEntry.customStatus"
						fill="solid"
						:label="$t('frontHistory:edit.customStatus')"
						label-placement="floating"
					/>
				</IonItem>

				<IonItem>
					<ContentEditable v-model="frontingEntry.comment" fill="solid" :label="$t('frontHistory:edit.comment')" />
				</IonItem>

				<IonItem>
					<IonButton fill="clear" @click="frontingEntry.comment = `${frontingEntry.comment || ''}<t:${Math.floor(Date.now() / 1000)}:f>`">
						{{ $t("other:addTimestamp") }}
					</IonButton>
					<IonButton fill="clear" @click="memberTagModal?.$el.present()">
						{{ $t("other:memberMention") }}
					</IonButton>
				</IonItem>
			</IonList>

			<IonList>
				<IonItem v-if="!frontingEntry.endTime" button :detail="false">
					<IonToggle v-model="frontingEntry.isLocked">
						<IonLabel>
							{{ $t("frontHistory:edit.isLocked") }}
						</IonLabel>
					</IonToggle>
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
				<IonFabButton :disabled="!frontingEntry.member || !!allFrontingInTimeSpan.find(x => x.member.uuid === frontingEntry.member?.uuid)" @click="save">
					<IonIcon :icon="saveMD" />
				</IonFabButton>
			</IonFab>
			

			<MemberSelect
				ref="memberSelectModal"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="true"
				:model-value="frontingEntry.member ? [frontingEntry.member] : []"
				:members-to-exclude="allFrontingInTimeSpan?.map(x => x.member)"
				@update:model-value="(e) => { if(e[0]) frontingEntry.member = e[0]; if(frontingEntry.influencing?.uuid === e[0].uuid) frontingEntry.influencing = undefined }"
			/>

			<MemberSelect
				ref="memberInfluencingModal"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="true"
				:always-emit="true"
				:model-value="frontingEntry.influencing ? [frontingEntry.influencing] : []"
				:members-to-include="allFrontingInTimeSpan?.map(x => x.member)"
				:members-to-exclude="frontingEntry.member ? [frontingEntry.member] : []"
				@update:model-value="(e) => { if(e[0]) frontingEntry.influencing = e[0] }"
			/>

			<PresenceHistory
				ref="presenceHistoryModal"
				:model-value="frontingEntry.presence"
				@update:model-value="async (e) => { frontingEntry.presence = e; await save(false) }"
			/>

			<MemberSelect
				ref="memberTagModal"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="true"
				:always-emit="true"
				:model-value="[]"
				@update:model-value="(e) => { if(e[0]) frontingEntry.comment = `${frontingEntry.comment || ''}@<m:${e[0].uuid}>` }"
			/>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	:deep(.avatar) {
		width: 48px;
		height: 48px;
	}

	.grid-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}

	.take-row {
		grid-column: 1 / span 2;
	}

	.grid-2 ion-item::part(native) {
		height: 100%;
	}
</style>
