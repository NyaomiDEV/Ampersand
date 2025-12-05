<script setup lang="ts">
	import {
		IonButton,
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
		IonToggle
	} from "@ionic/vue";
	import MD3SegmentButton from "../../components/MD3SegmentButton.vue";
	import Color from "../../components/Color.vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";
	import personMD from "@material-symbols/svg-600/outlined/person.svg";
	import journalMD from "@material-symbols/svg-600/outlined/book.svg";

	import { getTag, removeTag, saveTag } from "../../lib/db/tables/tags";
	import { Member, Tag, UUID } from "../../lib/db/entities";
	import { getCurrentInstance, h, onBeforeMount, ref, toRaw, watch } from "vue";
	import { addMaterialColors, rgbaToArgb, unsetMaterialColors } from "../../lib/theme";
	import { PartialBy } from "../../lib/types";
	import { useTranslation } from "i18next-vue";
	import { useRoute } from "vue-router";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import { addModal, removeModal } from "../../lib/modals";
	import MemberSelect from "../../modals/MemberSelect.vue";
	import { promptOkCancel } from "../../lib/util/misc";
	import { getMemberTagsForTag, tagMembers } from "../../lib/db/tables/memberTags";
	import { getJournalPostTagsForTag } from "../../lib/db/tables/journalPostTags";

	const loading = ref(false);

	const i18next = useTranslation();
	const self = getCurrentInstance();

	const emptyTag: PartialBy<Tag, "id"> = {
		name: "",
		type: 0,
		viewInLists: false
	};
	const tag = ref({ ...emptyTag });

	const route = useRoute();
	const router = useIonRouter();

	const count = ref(0);

	async function editTagMembers() {
		let members: Member[] = (await Array.fromAsync(getMemberTagsForTag(toRaw(tag.value) as Tag)))
			.map(x => x.member as Member);

		const vnode = h(MemberSelect, {
			customTitle: i18next.t("tagManagement:edit.members.title"),
			modelValue: members,
			onDidDismiss: async () => {
				await tagMembers(toRaw(tag.value) as Tag, members);
				await updateCount();
				removeModal(vnode);
			},
			"onUpdate:modelValue": v => { members = v; },
		});

		const modal = await addModal(vnode);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
		await (modal.el as any).present();
	}

	async function save(){
		await saveTag(toRaw(tag.value));
		router.back();
	}

	async function deleteTag(){
		if(await promptOkCancel(
			i18next.t("tagManagement:edit.delete.title"),
			i18next.t("tagManagement:edit.delete.confirm")
		)){
			await removeTag(tag.value.id!);
			router.back();
		}
	}

	async function updateRoute(){
		if(route.name !== "TagEdit") return;

		loading.value = true;

		if(route.query.uuid){
			const _tag = await getTag(route.query.uuid as UUID);
			if(_tag) tag.value = _tag;
			else tag.value = { ...emptyTag };
		} else tag.value = { ...emptyTag };

		updateColors();
		await updateCount();

		loading.value = false;
	}

	function updateColors(){
		if(tag.value.color){
			if(self?.vnode.el) addMaterialColors(rgbaToArgb(tag.value.color), self?.vnode.el as HTMLElement);
		} else 
			if(self?.vnode.el) unsetMaterialColors(self?.vnode.el as HTMLElement);
	}

	async function updateCount(){
		if(!tag.value.id) return;

		if(tag.value.type === 0)
			count.value = (await Array.fromAsync(getMemberTagsForTag(tag.value.id))).length;
		else //journal
			count.value = (await Array.fromAsync(getJournalPostTagsForTag(tag.value.id))).length;
	}

	watch(route, updateRoute);
	onBeforeMount(updateRoute);
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					:icon="backMD"
					default-href="/options/tagManagement/"
				/>
				<IonTitle>{{ tag.type === 0 ? $t("tagManagement:edit.header.member") : $t("tagManagement:edit.header.journal") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>
			<IonList inset>
				<IonItem>
					<IonInput
						v-model="tag.name"
						fill="outline"
						:label="$t('tagManagement:edit.name')"
						label-placement="floating"
					/>
				</IonItem>

				<IonItem>
					<IonTextarea
						v-model="tag.description"
						fill="outline"
						auto-grow
						:label="$t('tagManagement:edit.description')"
						label-placement="floating"
					/>
				</IonItem>

				<IonItem button :detail="false">
					<Color v-model="tag.color" @update:model-value="updateColors">
						<IonLabel>
							{{ $t("tagManagement:edit.color") }}
						</IonLabel>
					</Color>
					<IonButton
						v-if="tag.color"
						slot="end"
						shape="round"
						fill="outline"
						size="default"
						@click="(e) => { e.stopPropagation(); tag.color = undefined; updateColors() }"
					>
						<IonIcon
							slot="icon-only"
							:icon="trashMD"
							color="danger"
						/>
					</IonButton>
				</IonItem>

				<IonItem button :detail="false">
					<IonToggle v-model="tag.viewInLists">
						<IonLabel>
							{{ $t("tagManagement:edit.viewInLists") }}
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem v-if="!tag.id">
					<IonLabel>
						<h3 class="centered-text">{{ $t("tagManagement:edit.type.header") }}</h3>
						<IonSegment v-model="tag.type" class="segment-alt">
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

				<IonItem v-if="tag.id && tag.type === 0" button @click="editTagMembers">
					<IonIcon slot="start" :icon="personMD" aria-hidden="true" />
					<IonLabel>
						<h3>{{ $t("tagManagement:edit.members.title") }}</h3>
						<p>{{ $t("tagManagement:edit.members.desc", { count }) }}</p>
					</IonLabel>
				</IonItem>

				<IonItem v-if="tag.id && tag.type === 1" button :router-link="`/s/journal/?q=${encodeURIComponent(`#${tag.name.toLowerCase().replace(/\s+/g, '')}`)}`">
					<IonIcon slot="start" :icon="journalMD" aria-hidden="true" />
					<IonLabel>
						<h3>{{ $t("tagManagement:edit.showJournal.title") }}</h3>
						<p>{{ $t("tagManagement:edit.showJournal.desc", { count }) }}</p>
					</IonLabel>
				</IonItem>

				<IonItem
					v-if="tag.id"
					button
					:detail="false"
					@click="deleteTag"
				>
					<IonIcon
						slot="start"
						:icon="trashMD"
						aria-hidden="true"
						color="danger"
					/>
					<IonLabel color="danger">
						<h3>{{ $t("tagManagement:edit.delete.title") }}</h3>
						<p>{{ $t("other:genericDeleteDesc") }}</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton :disabled="!tag.name.length" @click="save">
					<IonIcon :icon="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>
