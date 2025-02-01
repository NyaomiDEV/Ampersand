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
		IonPage,
		IonBackButton,
		IonSegment,
		IonTextarea,
		useIonRouter,
		alertController
	} from "@ionic/vue";
	import MD3SegmentButton from "../../components/MD3SegmentButton.vue";
	import Color from "../../components/Color.vue";

	import {
		saveOutline as saveIOS,
		trashBinOutline as trashIOS,
		personOutline as personIOS,
		bookOutline as journalIOS
	} from "ionicons/icons";

	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";
	import personMD from "@material-symbols/svg-600/outlined/person.svg";
	import journalMD from "@material-symbols/svg-600/outlined/book.svg";

	import { getTags, newTag, removeTag, updateTag } from '../../lib/db/tables/tags';
	import { Tag } from "../../lib/db/entities";
	import { getCurrentInstance, inject, onBeforeMount, ref, watch } from "vue";
	import { addMaterialColors, rgbaToArgb, unsetMaterialColors } from "../../lib/theme";
	import { PartialBy } from "../../lib/types";
	import { getMembers } from "../../lib/db/tables/members";
	import { getJournalPosts } from "../../lib/db/tables/journalPosts";
	import { useTranslation } from "i18next-vue";
	import { useRoute } from "vue-router";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";

	const isIOS = inject<boolean>("isIOS");
	const loading = ref(false);

	const i18next = useTranslation();
	const self = getCurrentInstance();

	const emptyTag: PartialBy<Tag, "uuid"> = {
		name: "",
		type: "member"
	};
	const tag = ref({...emptyTag});

	const route = useRoute();
	const router = useIonRouter();

	const count = ref(0);

	async function save(){
		const uuid = tag.value.uuid;
		const _tag = tag.value;

		if(!uuid){
			await newTag(_tag);
			router.back();
			return;
		}

		await updateTag(uuid, _tag);
		router.back();
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

	async function updateRoute(){
		loading.value = true;

		if(route.query.uuid){
			const _tag = (await getTags()).find(x => x.uuid === route.query.uuid);
			if(_tag){
				tag.value = _tag;

				if(tag.value.type === "member")
					count.value = (await getMembers()).filter(x => x.tags.includes(tag.value.uuid!)).length;
				else //journal
					count.value = (await getJournalPosts()).filter(x => x.tags.includes(tag.value.uuid!)).length;
			}
			else tag.value = {...emptyTag};
		} else tag.value = {...emptyTag};

		updateColors();

		loading.value = false;
	}

	function updateColors(){
		if(tag.value.color && tag.value.color !== "#000000"){
			if(self?.vnode.el) addMaterialColors(rgbaToArgb(tag.value.color), self?.vnode.el as HTMLElement);
		} else {
			if(self?.vnode.el) unsetMaterialColors(self?.vnode.el as HTMLElement);
		}
	}

	watch(route, updateRoute);
	onBeforeMount(updateRoute);
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/tagManagement/" />
				<IonTitle>{{ tag.type === "member" ? $t("options:tagManagement.edit.header.member") : $t("options:tagManagement.edit.header.journal") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>
			<IonList inset>
					<IonItem>
						<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('options:tagManagement.edit.name')" labelPlacement="floating" v-model="tag.name" />
					</IonItem>

					<IonItem>
						<IonTextarea :fill="!isIOS ? 'outline' : undefined" auto-grow :label="$t('options:tagManagement.edit.description')" labelPlacement="floating" v-model="tag.description" />
					</IonItem>

					<IonItem button>
						<Color v-model="tag.color" @update:model-value="updateColors">
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

					<IonItem button v-if="tag.uuid && tag.type === 'member'" @click="() => router.push(`/s/members?q=${encodeURIComponent('#' + tag.name.toLowerCase().replace(/\s/g, ''))}`)">
						<IonIcon :ios="personIOS" :md="personMD" slot="start" aria-hidden="true" />
						<IonLabel>
							<h3>{{ $t("options:tagManagement.edit.actions.showMembers.title") }}</h3>
							<p>{{ $t("options:tagManagement.edit.actions.showMembers.desc", { count }) }}</p>
						</IonLabel>
					</IonItem>

					<IonItem button v-if="tag.uuid && tag.type === 'journal'">
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
							<p>{{ $t("other:genericDeleteDesc") }}</p>
						</IonLabel>
					</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save" v-if="tag.name.length > 0">
					<IonIcon :ios="saveIOS" :md="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>

<style scoped>
	ion-content {
		--padding-bottom: 80px;
	}

	.md ion-input, .md ion-textarea {
		margin: 16px 0;
	}
</style>