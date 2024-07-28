<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonButton,
		IonIcon,
		IonList,
		IonInput,
		IonFab,
		IonFabButton,
		IonLabel,
		IonItem,
		modalController,
		IonModal,
		IonButtons,
		IonSegment,
		IonSegmentButton
	} from "@ionic/vue";
	import Color from "../components/Color.vue";

	import {
		saveOutline as saveIOS,
		chevronBack as backIOS,
		trashBinOutline as trashIOS
	} from "ionicons/icons";

	import saveMD from "@material-design-icons/svg/outlined/save.svg";
	import backMD from "@material-design-icons/svg/outlined/arrow_back.svg";
	import trashMD from "@material-design-icons/svg/outlined/delete.svg";

	import { Tag, getTable, newTag, removeTag } from '../lib/db/entities/tags';
	import { Ref, inject, ref } from "vue";
	import { addMaterialColors, unsetMaterialColors } from "../lib/theme";

	type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
	const isOpen = inject<Ref<boolean>>("isOpen");
	const props = defineProps<{
		tag?: PartialBy<Tag, "uuid">,
		add: boolean,
		edit?: boolean
	}>();
	
	const tag = ref({
		name: props.tag?.name || "",
		type: props.tag?.type || "member",
		...props.tag || {}
	} as PartialBy<Tag, "uuid">);

	function dismiss(){
		if(isOpen) {
			isOpen.value = false;
			tag.value = {
				name: props.tag?.name || "",
				type: props.tag?.type || "member",
				...props.tag || {}
			};
		}
	}

	async function save(){
		const { uuid, ...tagWithoutUUID } = tag.value;

		if(!props.add){
			await getTable().update(tag.value.uuid, tagWithoutUUID);

			// update tag in props, since it's reactive
			for(const prop in tag.value)
				props.tag![prop] = tag.value[prop];

			try{
				await modalController.dismiss(undefined, "modified");
			}catch(_){}
			// catch an error because the type might get changed, causing the parent to be removed from DOM
			// however it's safe for us to ignore

		} else {
			await newTag(tagWithoutUUID);
			await modalController.dismiss(undefined, "added");
		}
	}

	async function deleteTag(){
		await removeTag(tag.value!.uuid!);
		await modalController.dismiss(undefined, "deleted");
	}

	const self = ref();
	function setAccent() {
		if(tag.value.color && tag.value.color !== "#000000"){
			addMaterialColors(tag.value.color, self.value.$el);
		} else {
			unsetMaterialColors(self.value.$el);
		}
	}
</script>

<template>
	<IonModal ref="self" :isOpen @willPresent="setAccent" @didDismiss="dismiss">
		<IonHeader>
			<IonToolbar>
				<IonButtons slot="start">
					<IonButton shape="round" fill="clear" @click="dismiss">
						<IonIcon slot="icon-only" :md="backMD" :ios="backIOS"></IonIcon>
					</IonButton>
				</IonButtons>
				<IonTitle>{{ tag.type === "member" ? $t("options:tagManagement.edit.header.member") : $t("options:tagManagement.edit.header.journal") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList inset>
					<IonItem lines="none">
						<IonInput mode="md" fill="outline" :label="$t('options:tagManagement.edit.name')" labelPlacement="floating" v-model="tag.name" />
					</IonItem>

					<IonItem button lines="none">
						<Color v-model="tag.color" @update:model-value="setAccent">
							<IonLabel>
								{{ $t("options:tagManagement.edit.color") }}
							</IonLabel>
						</Color>
					</IonItem>

					<IonItem lines="none" v-if="!tag.uuid">
						<IonLabel>
							<h3 class="centered-text">{{ $t("options:tagManagement.edit.type.header") }}</h3>
							<IonSegment class="segment-alt" v-model="tag.type">
								<IonSegmentButton value="member">
									<IonLabel>
										{{ $t("options:tagManagement.edit.type.member") }}
									</IonLabel>
								</IonSegmentButton>
								<IonSegmentButton value="journal">
									<IonLabel>
										{{ $t("options:tagManagement.edit.type.journal") }}
									</IonLabel>
								</IonSegmentButton>
							</IonSegment>
							<p class="centered-text">{{ $t("options:tagManagement.edit.type.desc") }}</p>
						</IonLabel>
					</IonItem>

					<IonItem button lines="none" v-if="tag.uuid" @click="deleteTag">
						<IonIcon :ios="trashIOS" :md="trashMD" slot="start" aria-hidden="true" />
						<IonLabel>
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
	ion-modal {
		--width: 100%;
		--height: 100%;
	}

	ion-content {
		--padding-bottom: 80px;
	}

	ion-input, ion-textarea {
		margin-top: 16px;
	}

	ion-item {
		margin-bottom: 16px;
	}
</style>