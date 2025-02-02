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
	} from "@ionic/vue";

	import { inject, onBeforeMount, reactive, ref, shallowRef, watch } from "vue";
	import { getFilteredTags } from "../lib/search";
	import { getTags } from "../lib/db/tables/tags";
	import { Tag } from "../lib/db/entities";
	import TagColor from "../components/tag/TagColor.vue";
	import TagLabel from "../components/tag/TagLabel.vue";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";

	const isIOS = inject<boolean>("isIOS");

	const props = defineProps<{
		customTitle?: string,
		modelValue?: Tag[]
	}>();

	const emit = defineEmits<{
		'update:modelValue': [Tag[]],
	}>();

	const selectedTags = reactive<Tag[]>([...props.modelValue || []]);
	const search = ref("");
	const tags = shallowRef<Tag[]>();
	const filteredTags = shallowRef<Tag[]>();

	watch(selectedTags, () => {
		emit("update:modelValue", selectedTags);
	});

	watch([search, tags], () => {
		filteredTags.value = getFilteredTags(search.value, tags.value);
	}, { immediate: true })

	onBeforeMount(async () => {
		tags.value = await getTags();
	});

	function check(tag: Tag, checked: boolean){
		if(checked)
			selectedTags.push(tag);
		else {
			const index = selectedTags.indexOf(tag);
			if(index > -1)
				selectedTags.splice(index, 1);
		}
	}
</script>

<template>
	<IonModal class="tag-select-modal" :breakpoints="[0,0.25,0.75,1]" initialBreakpoint="0.75">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ props.customTitle ?? $t("tagManagement:select") }}</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar :animated="true" :placeholder="$t('tagManagement:searchPlaceholder')"
					showCancelButton="focus" showClearButton="focus" :spellcheck="false" v-model="search" />
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="!tags" />
		<IonContent v-else>
			<IonList :inset="isIOS">
				<IonItem button v-for="tag in filteredTags" :key="tag.uuid">
					<TagColor slot="start" :tag />
					<IonCheckbox :value="tag.uuid" :checked="!!selectedTags.find(x => x.uuid === tag.uuid)" @update:modelValue="value => check(tag, value)">
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