<script setup lang="ts">
	import {
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

	import { inject, onMounted, ref, shallowRef } from "vue";
	import { getFilteredTags } from "../lib/db/search";
	import { getTags } from "../lib/db/tables/tags";
	import { Tag } from "../lib/db/entities";
	import TagColor from "../components/tag/TagColor.vue";
	import TagLabel from "../components/tag/TagLabel.vue";

	const isIOS = inject<boolean>("isIOS");

	const selectedTags = defineModel<Tag[]>({default: []});

	const search = ref("");
	const tags = shallowRef<Tag[]>([]);
	const filteredTags = getFilteredTags(search, ref("member"), tags);

	onMounted(async () => {
		tags.value = await getTags()
	});

	function check(ev: CheckboxCustomEvent){
		if(ev.detail.checked)
			selectedTags.value.push(tags.value.find(x => x.uuid === ev.detail.value)!);
		else {
			const index = selectedTags.value.findIndex(x => x.uuid === ev.detail.value);
			if(index > -1)
				selectedTags.value.splice(index, 1);
		}
	}
</script>

<template>
	<IonModal class="tag-select-modal" :breakpoints="[0,0.25,0.75,1]" initialBreakpoint="0.75">
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
				<IonItem button v-for="tag in filteredTags" :key="JSON.stringify(tag)">
					<TagColor slot="start" :tag />
					<IonCheckbox :value="tag.uuid" :checked="!!selectedTags.find(x => x.uuid === tag.uuid)" @ionChange="check">
						<TagLabel :tag />
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