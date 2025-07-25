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
		IonPage,
		IonBackButton,
		IonSegment,
		IonTextarea,
		useIonRouter,
		alertController,
		IonToggle
	} from "@ionic/vue";
	import MD3SegmentButton from "../../components/MD3SegmentButton.vue";
	import Color from "../../components/Color.vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";
	import personMD from "@material-symbols/svg-600/outlined/person.svg";
	import journalMD from "@material-symbols/svg-600/outlined/book.svg";

	import { getTag, newTag, removeTag, updateTag } from '../../lib/db/tables/tags';
	import { Member, Tag } from "../../lib/db/entities";
	import { getCurrentInstance, h, inject, onBeforeMount, ref, watch } from "vue";
	import { addMaterialColors, rgbaToArgb, unsetMaterialColors } from "../../lib/theme";
	import { PartialBy } from "../../lib/types";
	import { getMembers, updateMember } from "../../lib/db/tables/members";
	import { getJournalPosts } from "../../lib/db/tables/journalPosts";
	import { useTranslation } from "i18next-vue";
	import { useRoute } from "vue-router";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import { addModal, removeModal } from "../../lib/modals";
	import MemberSelect from "../../modals/MemberSelect.vue";

	const isIOS = inject<boolean>("isIOS");
	const loading = ref(false);

	const i18next = useTranslation();
	const self = getCurrentInstance();

	const emptyTag: PartialBy<Tag, "uuid"> = {
		name: "",
		type: "member",
		viewInLists: false
	};
	const tag = ref({...emptyTag});

	const route = useRoute();
	const router = useIonRouter();

	const count = ref(0);

	async function tagMembers() {
		const allMembers = await getMembers();
		let members: Member[] = allMembers.filter(x => x.tags.includes(tag.value.uuid!));
		const vnode = h(MemberSelect, {
			customTitle: i18next.t("tagManagement:edit.members.title"),
			modelValue: members,
			onDidDismiss: async () => {
				for(const member of allMembers){
					if(members.map(x => x.uuid).includes(member.uuid)){
						if(member.tags.includes(tag.value.uuid!)) continue;

						await updateMember(member.uuid, {
							tags: [...member.tags, tag.value.uuid!]
						});
					} else {
						if(!member.tags.includes(tag.value.uuid!)) continue;

						await updateMember(member.uuid, {
							tags: [...member.tags.filter(x => x !== tag.value.uuid!)]
						})
					}
				}
				removeModal(vnode);

				// we can't use allMembers here again because
				// at this point the db is updated and we don't have
				// the new values; besides, it's a non-issue to read
				// from disk here
				count.value = (await getMembers()).filter(x => x.tags.includes(tag.value.uuid!)).length;
			},
			"onUpdate:modelValue": v => { members = [...v] },
		});

		const modal = await addModal(vnode);
		await (modal.el as any).present();
	}

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
				header: i18next.t("tagManagement:edit.delete.title"),
				subHeader: i18next.t("tagManagement:edit.delete.confirm"),
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
			router.back();
		}
	}

	async function updateRoute(){
		if(route.name !== "TagEdit") return;

		loading.value = true;

		if(route.query.uuid){
			const _tag = await getTag(route.query.uuid as string);
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
		if(tag.value.color){
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
				<IonBackButton slot="start" :text="isIOS ? $t('other:back') : undefined" :icon="!isIOS ? backMD : undefined" defaultHref="/options/tagManagement/" />
				<IonTitle>{{ tag.type === "member" ? $t("tagManagement:edit.header.member") : $t("tagManagement:edit.header.journal") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>
			<IonList inset>
					<IonItem>
						<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('tagManagement:edit.name')" labelPlacement="floating" v-model="tag.name" />
					</IonItem>

					<IonItem>
						<IonTextarea :fill="!isIOS ? 'outline' : undefined" auto-grow :label="$t('tagManagement:edit.description')" labelPlacement="floating" v-model="tag.description" />
					</IonItem>

					<IonItem button :detail="false">
						<Color v-model="tag.color" @update:model-value="updateColors">
							<IonLabel>
								{{ $t("tagManagement:edit.color") }}
							</IonLabel>
						</Color>
					</IonItem>

					<IonItem button :detail="false">
						<IonToggle v-model="tag.viewInLists">
							<IonLabel>
								{{ $t("tagManagement:edit.viewInLists") }}
							</IonLabel>
						</IonToggle>
					</IonItem>

					<IonItem v-if="!tag.uuid">
						<IonLabel>
							<h3 class="centered-text">{{ $t("tagManagement:edit.type.header") }}</h3>
							<IonSegment class="segment-alt" v-model="tag.type">
								<MD3SegmentButton value="member">
									<IonLabel>
										{{ $t("tagManagement:edit.type.member") }}
									</IonLabel>
								</MD3SegmentButton>
								<MD3SegmentButton value="journal">
									<IonLabel>
										{{ $t("tagManagement:edit.type.journal") }}
									</IonLabel>
								</MD3SegmentButton>
							</IonSegment>
							<p class="centered-text">{{ $t("tagManagement:edit.type.desc") }}</p>
						</IonLabel>
					</IonItem>

					<IonItem button v-if="tag.uuid && tag.type === 'member'" @click="tagMembers">
						<IonIcon :icon="personMD" slot="start" aria-hidden="true" />
						<IonLabel>
							<h3>{{ $t("tagManagement:edit.members.title") }}</h3>
							<p>{{ $t("tagManagement:edit.members.desc", { count }) }}</p>
						</IonLabel>
					</IonItem>

					<IonItem button v-if="tag.uuid && tag.type === 'journal'" :routerLink="`/s/journal/?q=${encodeURIComponent('#' + tag.name.toLowerCase().replace(/\s+/g, ''))}`">
						<IonIcon :icon="journalMD" slot="start" aria-hidden="true" />
						<IonLabel>
							<h3>{{ $t("tagManagement:edit.showJournal.title") }}</h3>
							<p>{{ $t("tagManagement:edit.showJournal.desc", { count }) }}</p>
						</IonLabel>
					</IonItem>

					<IonItem button :detail="false" v-if="tag.uuid" @click="deleteTag">
						<IonIcon :icon="trashMD" slot="start" aria-hidden="true" color="danger"/>
						<IonLabel color="danger">
							<h3>{{ $t("tagManagement:edit.delete.title") }}</h3>
							<p>{{ $t("other:genericDeleteDesc") }}</p>
						</IonLabel>
					</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save" v-if="tag.name.length > 0">
					<IonIcon :icon="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>
