<script setup lang="ts">
	import {
		IonAvatar,
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonList,
		IonItem,
		IonModal,
		IonSearchbar,
		IonCheckbox,
		CheckboxCustomEvent,
	} from "@ionic/vue";

	import { inject, ref, ShallowReactive } from "vue";
	import { getFilteredTags } from "../lib/db/liveQueries";
	import { Tag } from "../lib/db/entities/tags";

	const isIOS = inject<boolean>("isIOS");
	const selectedTags = inject<ShallowReactive<Tag[]>>("selectedTags")!;
	
	function check(ev: CheckboxCustomEvent){
		if(ev.detail.checked)
			selectedTags.push(filteredTags.value?.find(x => x.uuid === ev.detail.value)!);
		else {
			const index = selectedTags.findIndex(x => x.uuid === ev.detail.value);
			if(index > -1)
				selectedTags.splice(index, 1);
		}
	}

	const search = ref("");
	const filteredTags = getFilteredTags(search, ref("member"));
</script>

<template>
	<IonModal class="tag-select-modal" :breakpoints="[0,0.25,0.5,1]" initialBreakpoint="0.25">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("other:taglistSelect:header") }}</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar :animated="true" :placeholder="$t('options:tagManagement.searchPlaceholder')"
					showCancelButton="focus" showClearButton="focus" :spellcheck="false" v-model="search" />
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList :inset="isIOS">
				<IonItem button v-for="tag in filteredTags" :key="tag.uuid">
					<IonAvatar slot="start" v-if="tag.color">
						<div :style="{
							backgroundColor: tag.color
						}"></div>
					</IonAvatar>
					<IonCheckbox :value="tag.uuid" :checked="!!selectedTags?.find(x => x.uuid === tag.uuid)" @ionChange="check">
						{{ tag.name }}
					</IonCheckbox>
				</IonItem>
			</IonList>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	ion-modal.tag-select-modal {
		--height: 100dvh;
		--border-radius: 16px;
	}

	div {
		position: relative;
		top: 15%;
		left: 15%;
		width: 75%;
		height: 75%;
		border-radius: 100%;
		aspect-ratio: 1;
	}
</style>