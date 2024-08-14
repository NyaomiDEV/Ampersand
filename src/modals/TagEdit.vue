<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonIcon,
		IonList,
		IonInput,
		IonFab,
		IonFabButton,
		IonLabel,
		IonItem,
		modalController,
		IonModal,
		IonSegment,
		IonTextarea,
		useIonRouter,
		alertController
	} from "@ionic/vue";
	import MD3SegmentButton from "../components/MD3SegmentButton.vue";
	import Color from "../components/Color.vue";

	import {
		saveOutline as saveIOS,
		trashBinOutline as trashIOS,
		personOutline as personIOS,
		bookOutline as journalIOS
	} from "ionicons/icons";

	import saveMD from "@material-design-icons/svg/outlined/save.svg";
	import trashMD from "@material-design-icons/svg/outlined/delete.svg";
	import personMD from "@material-design-icons/svg/outlined/person.svg";
	import journalMD from "@material-design-icons/svg/outlined/book.svg";

	import { Tag, getTagsTable, newTag, removeTag } from '../lib/db/entities/tags';
	import { inject, ref, shallowRef } from "vue";
	import { addMaterialColors, unsetMaterialColors } from "../lib/theme";
	import { PartialBy } from "../lib/db/types";
	import { globalEvents, SearchEvent } from "../lib/globalEvents";
	import { getMembersTable } from "../lib/db/entities/members";
	import { getJournalPostsTable } from "../lib/db/entities/journalPosts";
	import { useTranslation } from "i18next-vue";

	const isIOS = inject<boolean>("isIOS");
	const i18next = useTranslation();

	const props = defineProps<{
		tag: PartialBy<Tag, "uuid">
	}>();

	const tag = shallowRef(props.tag);

	const self = ref();

	const router = useIonRouter();

	const count = ref(0);

	async function goBackAndSearchInMembers(search: string){
		router.navigate("/members", "back", "push");
		await modalController.dismiss();
		globalEvents.dispatchEvent(new CustomEvent("members:search", { detail: {search} }) as SearchEvent)
	}

	async function goBackAndSearchInJournal(search: string){
		// not yet sorry
		return;

		router.navigate("/journal", "back", "push");
		await modalController.dismiss();
		globalEvents.dispatchEvent(new CustomEvent("journal:search", { detail: {search} }))
	}

	async function save(){
		const uuid = tag.value.uuid;
		const _tag = tag.value;

		if(!uuid){
			await newTag(_tag);
			await modalController.dismiss(null, "added");
	
			return;
		}

		await getTagsTable().update(uuid, _tag);

		try{
			await modalController.dismiss(null, "modified");
		}catch(_){}
		// catch an error because the type might get changed, causing the parent to be removed from DOM
		// however it's safe for us to ignore
	}

	function promptDeletion(): Promise<boolean> {
		return new Promise(async (resolve) => {
			const alert = await alertController.create({
				header: i18next.t("options:tagManagement.edit.actions.delete.title"),
				subHeader: i18next.t("options:tagManagement.edit.actions.delete.confirm"),
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

	async function deleteTag(){
		if(await promptDeletion()){
			await removeTag(tag.value.uuid!);
			try {
				await modalController.dismiss(undefined, "deleted");
			} catch (_) { }
		}
	}

	function present() {
		tag.value = props.tag;

		if(tag.value.uuid){
			if(tag.value.type === "member")
				getMembersTable().filter(x => x.tags.includes(tag.value.uuid!)).count().then(c => count.value = c);
			else //journal
				getJournalPostsTable().filter(x => x.tags.includes(tag.value.uuid!)).count().then(c => count.value = c);
		}

		if(tag.value.color && tag.value.color !== "#000000"){
			addMaterialColors(tag.value.color, self.value.$el);
		} else {
			unsetMaterialColors(self.value.$el);
		}
	}
</script>

<template>
	<IonModal class="tag-edit-modal" ref="self" @willPresent="present" :breakpoints="[0,1]" initialBreakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ tag.type === "member" ? $t("options:tagManagement.edit.header.member") : $t("options:tagManagement.edit.header.journal") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList inset>
					<IonItem>
						<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('options:tagManagement.edit.name')" labelPlacement="floating" v-model="tag.name" />
					</IonItem>

					<IonItem>
						<IonTextarea :fill="!isIOS ? 'outline' : undefined" auto-grow :label="$t('options:tagManagement.edit.description')" labelPlacement="floating" v-model="tag.description" />
					</IonItem>

					<IonItem button>
						<Color v-model="tag.color" @update:model-value="present">
							<IonLabel>
								{{ $t("options:tagManagement.edit.color") }}
							</IonLabel>
						</Color>
					</IonItem>

					<IonItem v-if="!tag.uuid">
						<IonLabel>
							<h3 class="centered-text">{{ $t("options:tagManagement.edit.type.header") }}</h3>
							<IonSegment class="segment-alt" v-model="tag.type">
								<MD3SegmentButton value="member">
									<IonLabel>
										{{ $t("options:tagManagement.edit.type.member") }}
									</IonLabel>
								</MD3SegmentButton>
								<MD3SegmentButton value="journal">
									<IonLabel>
										{{ $t("options:tagManagement.edit.type.journal") }}
									</IonLabel>
								</MD3SegmentButton>
							</IonSegment>
							<p class="centered-text">{{ $t("options:tagManagement.edit.type.desc") }}</p>
						</IonLabel>
					</IonItem>

					<IonItem button v-if="tag.uuid && tag.type === 'member'" @click="goBackAndSearchInMembers(`#${tag.name.toLowerCase().replace(/\s/g, '')}`)">
						<IonIcon :ios="personIOS" :md="personMD" slot="start" aria-hidden="true" />
						<IonLabel>
							<h3>{{ $t("options:tagManagement.edit.actions.showMembers.title") }}</h3>
							<p>{{ $t("options:tagManagement.edit.actions.showMembers.desc", { count }) }}</p>
						</IonLabel>
					</IonItem>

					<IonItem button v-if="tag.uuid && tag.type === 'journal'" @click="goBackAndSearchInJournal(`#${tag.name.toLowerCase().replace(/\s/g, '')}`)">
						<IonIcon :ios="journalIOS" :md="journalMD" slot="start" aria-hidden="true" />
						<IonLabel>
							<h3>{{ $t("options:tagManagement.edit.actions.showJournal.title") }}</h3>
							<p>{{ $t("options:tagManagement.edit.actions.showJournal.desc", { count }) }}</p>
						</IonLabel>
					</IonItem>

					<IonItem button v-if="tag.uuid" @click="deleteTag">
						<IonIcon :ios="trashIOS" :md="trashMD" slot="start" aria-hidden="true" color="danger"/>
						<IonLabel color="danger">
							<h3>{{ $t("options:tagManagement.edit.actions.delete.title") }}</h3>
							<p>{{ $t("options:tagManagement.edit.actions.delete.desc") }}</p>
						</IonLabel>
					</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save" v-if="tag.name.length > 0">
					<IonIcon :ios="saveIOS" :md="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	ion-modal.tag-edit-modal {
		--height: 50dvh;
		--min-height: 600px;
		--border-radius: 16px;
	}

	ion-content {
		--padding-bottom: 80px;
	}

	.md ion-input, .md ion-textarea {
		margin: 16px 0;
	}
</style>