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
		IonItem,
		modalController,
		IonModal,
		useIonRouter,
	} from "@ionic/vue";

	import saveMD from "@material-symbols/svg-600/rounded/save.svg";
	import trashMD from "@material-symbols/svg-600/rounded/delete.svg";
	import accountCircle from "@material-symbols/svg-600/rounded/account_circle-fill.svg";

	import { FrontingEntry, FrontingEntryComplete, Member, UUIDable } from "../lib/db/entities";
	import { newFrontingEntry, updateFrontingEntry, deleteFrontingEntry, sendFrontingChangedEvent, getFrontingBetweenIndex } from "../lib/db/tables/frontingEntries";
	import { ref, shallowRef, toRaw, useTemplateRef, watch } from "vue";
	import { useTranslation } from "i18next-vue";
	import { PartialBy } from "../lib/types";
	import { formatDate, promptOkCancel, toast, presencePhrase, sortDate } from "../lib/util/misc";
	import { IndexEntry } from "../lib/db/types";
	import { defaultMember, getMember } from "../lib/db/tables/members";

	import MemberSelect from "./MemberSelect.vue";
	import PresenceHistory from "./PresenceHistory.vue";
	import DatePopupPicker from "../components/DatePopupPicker.vue";
	import ContentEditable from "../components/ContentEditable.vue";
	import PresenceRating from "../components/PresenceRating.vue";
	import MemberItem from "../components/member/MemberItem.vue";
	import Comments from "./Comments.vue";
	import Loading from "./Loading.vue";
	import MemberChip from "../components/member/MemberChip.vue";
	import AvatarStack from "../components/AvatarStack.vue";

	const i18next = useTranslation();
	const router = useIonRouter();

	const props = defineProps<{
		frontingEntry?: PartialBy<FrontingEntryComplete, keyof UUIDable | "member">,
		overrideStartTime?: Date,
		overrideEndTime?: Date
	}>();

	const emptyFrontingEntry: PartialBy<FrontingEntryComplete, keyof UUIDable | "member"> = {
		isMainFronter: false,
		startTime: props.overrideStartTime || new Date(),
		endTime: props.overrideEndTime || new Date(),
		isLocked: false,
	};
	const frontingEntry = ref({ ...(props.frontingEntry || emptyFrontingEntry) });
	const allFrontingInTimeSpan = ref<IndexEntry<FrontingEntry>[]>([]);

	const presenceHistoryModal = useTemplateRef("presenceHistoryModal");
	const memberSelectModal = useTemplateRef("memberSelectModal");
	const memberInfluencingModal = useTemplateRef("memberInfluencingModal");
	const memberTagModal = useTemplateRef("memberTagModal");
	const frontingEntryComments = useTemplateRef("frontingEntryComments");
	const loadingModal = useTemplateRef("loadingModal");

	const frontingEntryCommentAvatars = shallowRef<InstanceType<typeof AvatarStack>["$props"]["avatars"]>();

	async function save(dismissAfter = true){
		const uuid = frontingEntry.value?.uuid;
		const _frontingEntry = toRaw(frontingEntry.value);

		if(!_frontingEntry.member) return;

		if(_frontingEntry.isMainFronter)
			_frontingEntry.influencing = undefined;

		if(_frontingEntry.endTime)
			_frontingEntry.isLocked = false;

		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.present();

			if(!uuid) {
				const result = await newFrontingEntry({
					..._frontingEntry,
					member: _frontingEntry.member.uuid,
					influencing: _frontingEntry.influencing?.map(x => x.uuid),
					dateCreated: new Date()
				});
				if(!result.success) throw new Error(`E: ${result.err || "failed"}`);

				void sendFrontingChangedEvent();

				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.dismiss();

				if(dismissAfter)
					await modalController.dismiss(null, "added");

				return;
			}

			const result = await updateFrontingEntry({
				..._frontingEntry,
				member: _frontingEntry.member.uuid,
				influencing: _frontingEntry.influencing?.map(x => x.uuid)
			} as FrontingEntry);
			if(!result.success) throw new Error(`E: ${result.err || "failed"}`);

			void sendFrontingChangedEvent();

			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();
		
			if(dismissAfter)
				await modalController.dismiss(null, "modified").catch(() => false);
		}catch(e){
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

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
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.present();

				const result = await deleteFrontingEntry(frontingEntry.value.uuid!);
				if(!result.success) throw new Error(`E: ${result.err || "failed"}`);

				void sendFrontingChangedEvent();
			
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.dismiss();

				await modalController.dismiss(undefined, "deleted").catch(() => false);
			}
		}catch(e){
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

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

	async function routeToMember(member: Member){
		if(await modalController.dismiss(undefined).catch(() => false))
			router.push(`/edit/member?uuid=${member.uuid}`);
	}

	async function getCommentAvatars(){
		const commentMemberUUIDs = [...new Set(frontingEntry.value.comments?.toSorted(sortDate).map(x => x.member))];
		const members = (await Promise.all(
			commentMemberUUIDs.map(async x => await getMember(x).catch(() => defaultMember(x)))
		));

		return members.map(x => ({
			image: x.image,
			clipShape: x.imageClip,
			color: x.color,
			icon: accountCircle
		}));
	}

	watch(frontingEntry.value, async () => {
		allFrontingInTimeSpan.value = getFrontingBetweenIndex(frontingEntry.value.startTime, frontingEntry.value.endTime).filter(x => x.uuid !== frontingEntry.value.uuid);
		frontingEntryCommentAvatars.value = await getCommentAvatars();
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
					@avatar-click="(e) => { e.stopImmediatePropagation(); routeToMember(frontingEntry.member!); }"
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
					<IonItem
						button
						:detail="!!frontingEntry.influencing"
						:class="{ 'take-row': frontingEntry.influencing }"
						@click="memberInfluencingModal?.$el.present()"
					>
						<IonLabel>
							<h2 v-if="frontingEntry.influencing">{{ $t("frontHistory:edit.influencing.currentlyInfluencing") }}</h2>
							<h2 v-else>{{ $t("frontHistory:edit.influencing.select") }}</h2>
							
							<MemberChip v-for="member in frontingEntry.influencing" :key="member.uuid" :member />
						</IonLabel>
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
					</IonItem>
				</template>
				
			</IonList>

			<IonList class="surface">
				<IonItem>
					<ContentEditable v-model="frontingEntry.summary" fill="solid" :label="$t('frontHistory:edit.summary')" />
				</IonItem>

				<IonItem>
					<IonButton fill="clear" @click="frontingEntry.summary = `${frontingEntry.summary || ''}<t:${Math.floor(Date.now() / 1000)}:f>`">
						{{ $t("other:addTimestamp") }}
					</IonButton>
					<IonButton fill="clear" @click="memberTagModal?.$el.present()">
						{{ $t("other:memberMention") }}
					</IonButton>
				</IonItem>
			</IonList>

			<IonList>
				<IonItem
					class="comments"
					button
					detail
					@click="frontingEntryComments?.$el.present()"
				>
					<AvatarStack
						v-if="frontingEntryCommentAvatars?.length"
						slot="start"
						:avatars="frontingEntryCommentAvatars"
						normal-stack
					/>
					{{ $t("other:comments.commentCount", { count: frontingEntry.comments?.length || 0 }) }}
				</IonItem>
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
				<IonFabButton :disabled="!frontingEntry.member || !!allFrontingInTimeSpan.find(x => x.member === frontingEntry.member?.uuid)" @click="save">
					<IonIcon :icon="saveMD" />
				</IonFabButton>
			</IonFab>
			
			<MemberSelect
				ref="memberSelectModal"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="true"
				:model-value="frontingEntry.member ? [frontingEntry.member] : []"
				:members-to-exclude="allFrontingInTimeSpan?.map(x => x.member!)"
				@update:model-value="(e) => { if(e[0]) frontingEntry.member = e[0]; if(frontingEntry.influencing?.find(x => x.uuid === e[0].uuid)) frontingEntry.influencing = frontingEntry.influencing.filter(x => x.uuid !== e[0].uuid) }"
			/>

			<MemberSelect
				ref="memberInfluencingModal"
				:always-emit="true"
				:model-value="frontingEntry.influencing"
				:members-to-include="allFrontingInTimeSpan?.map(x => x.member!)"
				:members-to-exclude="frontingEntry.member ? [frontingEntry.member] : []"
				@update:model-value="(e) => { if(e.length) frontingEntry.influencing = e; else frontingEntry.influencing = undefined; }"
			/>

			<PresenceHistory
				ref="presenceHistoryModal"
				:model-value="frontingEntry.presence"
				:start="frontingEntry.startTime"
				:end="frontingEntry.endTime"
				@update:model-value="async (e) => { frontingEntry.presence = e; await save(false) }"
			/>

			<MemberSelect
				ref="memberTagModal"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="true"
				:always-emit="true"
				:model-value="[]"
				@update:model-value="(e) => { if(e[0]) frontingEntry.summary = `${frontingEntry.summary || ''}@<m:${e[0].uuid}>` }"
			/>

			<Comments
				v-if="frontingEntry.uuid"
				ref="frontingEntryComments"
				:model-value="frontingEntry.comments"
				@update:model-value="(e) => {
					frontingEntry.comments = e;
					updateFrontingEntry({
						...frontingEntry as FrontingEntryComplete,
						member: frontingEntry.member?.uuid,
						influencing: frontingEntry.influencing?.map(x => x.uuid),
					});
				}"
			/>

			<Loading ref="loadingModal" />

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

	.comments .avatar-stack * {
		width: 36px;
		height: 36px;
		--gap: 24px;
	}
</style>
