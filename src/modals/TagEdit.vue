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
		IonTextarea
	} from "@ionic/vue";
	import MD3SegmentButton from "../components/MD3SegmentButton.vue";
	import Color from "../components/Color.vue";

	import {
		saveOutline as saveIOS,
		trashBinOutline as trashIOS
	} from "ionicons/icons";

	import saveMD from "@material-design-icons/svg/outlined/save.svg";
	import trashMD from "@material-design-icons/svg/outlined/delete.svg";

	import { Tag, getTable, newTag, removeTag } from '../lib/db/entities/tags';
	import { Ref, inject, ref, toRaw } from "vue";
	import { addMaterialColors, unsetMaterialColors } from "../lib/theme";
	import { PartialBy } from "../lib/db/types";

	const tag = inject<Ref<PartialBy<Tag, "uuid"> | undefined>>("tag")!;

	const self = ref();

	async function save(){
		if(!tag.value) return;

		const uuid = tag.value?.uuid;
		const _tag = toRaw(tag.value);

		if(!uuid){
			await newTag(_tag);
			await modalController.dismiss(null, "added");
	
			return;
		}

		await getTable().update(uuid, _tag);

		try{
			await modalController.dismiss(null, "modified");
		}catch(_){}
		// catch an error because the type might get changed, causing the parent to be removed from DOM
		// however it's safe for us to ignore
	}

	async function deleteTag(){
		if(!tag.value) return;

		await removeTag(tag.value.uuid!);
		try{
			await modalController.dismiss(undefined, "deleted");
		}catch(_){}
	}

	function present() {
		if(!tag.value) return;

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
				<IonTitle>{{ tag!.type === "member" ? $t("options:tagManagement.edit.header.member") : $t("options:tagManagement.edit.header.journal") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList inset>
					<IonItem lines="none">
						<IonInput mode="md" fill="outline" :label="$t('options:tagManagement.edit.name')" labelPlacement="floating" v-model="tag!.name" />
					</IonItem>

					<IonItem lines="none">
						<IonTextarea mode="md" fill="outline" auto-grow :label="$t('options:tagManagement.edit.description')" labelPlacement="floating" v-model="tag!.description" />
					</IonItem>

					<IonItem button lines="none">
						<Color v-model="tag!.color" @update:model-value="present">
							<IonLabel>
								{{ $t("options:tagManagement.edit.color") }}
							</IonLabel>
						</Color>
					</IonItem>

					<IonItem lines="none" v-if="!tag!.uuid">
						<IonLabel>
							<h3 class="centered-text">{{ $t("options:tagManagement.edit.type.header") }}</h3>
							<IonSegment class="segment-alt" v-model="tag!.type">
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

					<IonItem button lines="none" v-if="tag!.uuid" @click="deleteTag">
						<IonIcon :ios="trashIOS" :md="trashMD" slot="start" aria-hidden="true" />
						<IonLabel>
							<h3>{{ $t("options:tagManagement.edit.actions.delete.title") }}</h3>
							<p>{{ $t("options:tagManagement.edit.actions.delete.desc") }}</p>
						</IonLabel>
					</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save" v-if="tag!.name.length > 0">
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

	ion-input, ion-textarea {
		margin: 16px 0;
	}
</style>