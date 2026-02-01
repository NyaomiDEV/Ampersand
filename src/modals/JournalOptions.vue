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
	} from "@ionic/vue";

	import { JournalPostComplete, Tag } from "../lib/db/entities";
	import { PartialBy } from "../lib/types";
	import TagListSelect from "./TagListSelect.vue";
	import DatePopupPicker from "../components/DatePopupPicker.vue";
	import { useTranslation } from "i18next-vue";
	import { Ref, ShallowRef, useTemplateRef } from "vue";
	import { promptOkCancel, toast, formatDate } from "../lib/util/misc";
	import { deleteJournalPost } from "../lib/db/tables/journalPosts";

	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	const i18next = useTranslation();
	const router = useIonRouter();

	const tagSelectionModal = useTemplateRef("tagSelectionModal");

	const props = defineProps<{
		post: Ref<PartialBy<JournalPostComplete, "uuid" | "member">>
		tags: ShallowRef<Tag[]>
	}>();
	const post = props.post;
	const tags = props.tags;

	async function removePost() {
		if(await promptOkCancel(
			i18next.t("journal:edit.delete.title"),
			i18next.t("journal:edit.delete.confirm")
		)){
			await deleteJournalPost(post.value.uuid!);
			router.back();
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
</script>

<template>
	<IonModal class="journal-options-modal" :breakpoints="[0,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("journal:edit.headerOptions") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList inset>
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
								v-for="tag in post.tags"
								:key="tag"
								:tag="tags.find(x => x.uuid === tag)!"
							/>
						</div>
					</IonLabel>
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

				<IonItem>
					<IonTextarea
						v-model="post.contentWarning"
						fill="outline"
						auto-grow
						:label="$t('journal:edit.contentWarning')"
						label-placement="floating"
					/>
				</IonItem>

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
			</IonList>

			<TagListSelect
				ref="tagSelectionModal"
				type="journal"
				:model-value="post.tags.map(uuid => tags.find(x => x.uuid === uuid)!)"
				@update:model-value="tags => { post.tags = tags.map(x => x.uuid); }"
			/>

		</IonContent>
	</IonModal>
</template>
