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

	import { getTag, newTag, removeTag, updateTag } from "../../lib/db/tables/tags";
	import { Member, Tag } from "../../lib/db/entities";
	import { getCurrentInstance, h, onBeforeMount, ref, watch } from "vue";
	import { addMaterialColors, rgbaToArgb, unsetMaterialColors } from "../../lib/theme";
	import { PartialBy } from "../../lib/types";
	import { getMembers, updateMember } from "../../lib/db/tables/members";
	import { getJournalPosts } from "../../lib/db/tables/journalPosts";
	import { useTranslation } from "i18next-vue";
	import { useRoute } from "vue-router";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import { addModal, removeModal } from "../../lib/modals";
	import MemberSelect from "../../modals/MemberSelect.vue";
	import { promptOkCancel } from "../../lib/util/misc";

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
		const allMembers = await Array.fromAsync(getMembers());
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
						});
					}
				}
				removeModal(vnode);

				// we can't use allMembers here again because
				// at this point the db is updated and we don't have
				// the new values; besides, it's a non-issue to read
				// from disk here
				count.value = (await Array.fromAsync(getMembers())).filter(x => x.tags.includes(tag.value.uuid!)).length;
			},
			"onUpdate:modelValue": v => { members = [...v]; },
		});

		const modal = await addModal(vnode);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
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

	async function deleteTag(){
		if(await promptOkCancel(
			i18next.t("tagManagement:edit.delete.title"),
			i18next.t("tagManagement:edit.delete.confirm")
		)){
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

				let _count = 0;

				if(tag.value.type === "member"){
					for await (const member of getMembers()){
						if(member.tags.includes(tag.value.uuid!))
							_count++;
					}
				} else { //journal
					for await (const journalPost of getJournalPosts()){
						if(journalPost.tags.includes(tag.value.uuid!))
							_count++;
					}
				}

				count.value = _count;
			}
			else tag.value = {...emptyTag};
		} else tag.value = {...emptyTag};

		updateColors();

		loading.value = false;
	}

	function updateColors(){
		if(tag.value.color){
			if(self?.vnode.el) addMaterialColors(rgbaToArgb(tag.value.color), self?.vnode.el as HTMLElement);
		} else 
			if(self?.vnode.el) unsetMaterialColors(self?.vnode.el as HTMLElement);
		
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
				<IonTitle>{{ tag.type === "member" ? $t("tagManagement:edit.header.member") : $t("tagManagement:edit.header.journal") }}</IonTitle>
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

				<IonItem v-if="!tag.uuid">
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

				<IonItem v-if="tag.uuid && tag.type === 'member'" button @click="tagMembers">
					<IonIcon slot="start" :icon="personMD" aria-hidden="true" />
					<IonLabel>
						<h3>{{ $t("tagManagement:edit.members.title") }}</h3>
						<p>{{ $t("tagManagement:edit.members.desc", { count }) }}</p>
					</IonLabel>
				</IonItem>

				<IonItem v-if="tag.uuid && tag.type === 'journal'" button :router-link="`/s/journal/?q=${encodeURIComponent('#' + tag.name.toLowerCase().replace(/\s+/g, ''))}`">
					<IonIcon slot="start" :icon="journalMD" aria-hidden="true" />
					<IonLabel>
						<h3>{{ $t("tagManagement:edit.showJournal.title") }}</h3>
						<p>{{ $t("tagManagement:edit.showJournal.desc", { count }) }}</p>
					</IonLabel>
				</IonItem>

				<IonItem
					v-if="tag.uuid"
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
				<IonFabButton v-if="tag.name.length > 0" @click="save">
					<IonIcon :icon="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>
