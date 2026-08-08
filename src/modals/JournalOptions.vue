<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonIcon,
		IonToggle,
		IonList,
		IonLabel,
		IonItem,
		IonModal,
		IonTextarea,
		useIonRouter,
		modalController,
		IonButton
	} from "@ionic/vue";

	import { JournalPostComplete, Tag, UUIDable } from "../lib/db/entities";
	import { PartialBy } from "../lib/types";
	import TagListSelect from "./TagListSelect.vue";
	import DatePopupPicker from "../components/DatePopupPicker.vue";
	import TagChip from "../components/tag/TagChip.vue";
	import { useTranslation } from "i18next-vue";
	import { onMounted, ref, Ref, ShallowRef, useTemplateRef } from "vue";
	import { promptOkCancel, toast, formatDate, sortName, getCustomName } from "../lib/util/misc";
	import { deleteJournalPost } from "../lib/db/tables/journalPosts";
	import Color from "../components/Color.vue";

	import trashMD from "@material-symbols/svg-600/rounded/delete.svg";
	import Loading from "./Loading.vue";
	import { getFrontingAtIndex } from "../lib/db/tables/frontingEntries.ts";
	import { defaultMember, getMember } from "../lib/db/tables/members.ts";

	const i18next = useTranslation();
	const router = useIonRouter();

	const tagSelectionModal = useTemplateRef("tagSelectionModal");
	const loadingModal = useTemplateRef("loadingModal");

	const props = defineProps<{
		post: Ref<PartialBy<JournalPostComplete, keyof UUIDable>>
		tags: ShallowRef<Tag[]>
	}>();
	const post = props.post;
	const tags = props.tags;

	const frontingAtCreationDate = ref<string>();

	async function removePost() {
		try{
			if(await promptOkCancel(
				i18next.t("journal:edit.delete.title"),
				undefined,
				i18next.t("journal:edit.delete.confirm")
			)){
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.present();

				const result = await deleteJournalPost(post.value.uuid!);
				if(!result.success) throw new Error(`E: ${result.err || "failed"}`);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.dismiss();

				await modalController.dismiss();
				router.back();
			}
		}catch(e){
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.present();

			await toast((e as Error).message);
		}
	}

	async function copyIdToClipboard(){
		if(post.value.uuid){
			try{
				await window.navigator.clipboard.writeText(`@<j:${post.value.uuid}>`);
				await toast(i18next.t("journal:edit.postIDcopiedToClipboard"));
			}catch(_e){
				return;
			}
		}
	}

	async function getPeopleFrontingAtCreation(){
		if(!post.value?.dateCreated) return;

		const frontingIndex = getFrontingAtIndex(post.value.dateCreated);
		const memberUUIDs = new Set(frontingIndex.map(x => x.member!));

		frontingAtCreationDate.value = (await Promise.all(
			memberUUIDs.values()
				.map(x => getMember(x).catch(_ => defaultMember(x)))
		))
			.map(x => getCustomName(x))
			.join(", ");
	}

	onMounted(getPeopleFrontingAtCreation);
</script>

<template>
	<IonModal class="journal-options-modal" :breakpoints="[0,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("journal:edit.headerOptions") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList>
				<IonItem button :detail="true" @click="($refs.datePicker as any)?.$el.present()">
					<IonLabel>
						<h2>{{ $t("journal:edit.date") }}</h2>
						<p>{{ formatDate(post.date, "expanded") }}</p>
					</IonLabel>
					<DatePopupPicker
						ref="datePicker"
						v-model="post.date"
						show-default-buttons
						:title="$t('journal:edit.date')"
					/>
				</IonItem>

				<IonItem button :detail="true" @click="tagSelectionModal?.$el.present()">
					<IonLabel>
						{{ $t("journal:edit.tags") }}
						<div v-if="tags?.length" class="journal-tags">
							<TagChip
								v-for="tag in post.tags.map(x => tags.find(y => y.uuid === x)).filter(x => !!x).sort(sortName)"
								:key="tag.uuid"
								:tag
							/>
						</div>
					</IonLabel>
				</IonItem>

				<IonItem button :detail="false">
					<Color v-model="post.color">
						<IonLabel>
							{{ $t("journal:edit.color") }}
						</IonLabel>
					</Color>
					<IonButton
						v-if="post.color"
						slot="end"
						shape="round"
						fill="outline"
						size="small"
						@click="(e) => { e.stopPropagation(); post.color = undefined; }"
					>
						<IonIcon
							slot="icon-only"
							:icon="trashMD"
							color="danger"
						/>
					</IonButton>
				</IonItem>

				<IonItem button :detail="false">
					<IonToggle v-model="post.isPinned">
						<IonLabel>
							{{ $t("journal:edit.isPinned") }}
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem button :detail="false">
					<IonToggle v-model="post.isPrivate">
						<IonLabel>
							{{ $t("journal:edit.isPrivate") }}
						</IonLabel>
					</IonToggle>
				</IonItem>
			</IonList>

			<IonList class="surface">
				<IonItem>
					<IonTextarea
						v-model="post.contentWarning"
						fill="solid"
						auto-grow
						:label="$t('journal:edit.contentWarning')"
						label-placement="floating"
					/>
				</IonItem>
			</IonList>

			<IonList>
				<IonItem
					v-if="post.uuid"
					button
					:detail="false"
					@click="removePost"
				>
					<IonIcon
						slot="start"
						:icon="trashMD"
						aria-hidden="true"
						color="danger"
					/>
					<IonLabel color="danger">
						<h3>{{ $t("journal:edit.delete.title") }}</h3>
						<p>{{ $t("other:genericDeleteDesc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem
					v-if="post.uuid"
					:detail="false"
					button
					@click="copyIdToClipboard"
				>
					<IonLabel>
						<p>{{ $t("journal:edit.postID", { postID: post.uuid }) }}</p>
					</IonLabel>
				</IonItem>

				<IonItem v-if="post.dateCreated" :detail="false">
					<IonLabel>
						<p>
							{{ $t("other:creation.dateCreated", { dateCreated: formatDate(post.dateCreated, "expanded") }) }}
						</p>
						<p v-if="frontingAtCreationDate?.length">
							{{ $t("other:creation.frontingAtCreationDate", { frontingAtCreationDate }) }}
						</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<TagListSelect
				ref="tagSelectionModal"
				type="journal"
				:model-value="post.tags.map(uuid => tags.find(x => x.uuid === uuid)).filter(x => !!x)"
				@update:model-value="tags => { post.tags = tags.map(x => x.uuid); }"
			/>

			<Loading ref="loadingModal" />
		</IonContent>
	</IonModal>
</template>
