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

	import { inject, onBeforeMount, reactive, ref, shallowRef, toRaw, watch } from "vue";
	import { getFilteredTags } from "../lib/db/tables/tags";
	import { Tag } from "../lib/db/entities";
	import TagColor from "../components/tag/TagColor.vue";
	import TagLabel from "../components/tag/TagLabel.vue";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";

	const isIOS = inject<boolean>("isIOS");

	const props = defineProps<{
		customTitle?: string,
		type: "member" | "journal"
		modelValue?: Tag[]
	}>();

	const emit = defineEmits<{
		'update:modelValue': [Tag[]],
	}>();

	const selectedTags = reactive<Tag[]>([...props.modelValue || []]);
	const search = ref("");
	const tags = shallowRef<Tag[]>();

	watch(selectedTags, () => {
		emit("update:modelValue",  [...toRaw(selectedTags)]);
	});

	watch([search, tags], async () => {
		tags.value = (await Array.fromAsync(getFilteredTags(search.value))).filter(x => x.type === props.type);
	}, { immediate: true })

	onBeforeMount(async () => {
		tags.value = (await Array.fromAsync(getFilteredTags(search.value))).filter(x => x.type === props.type);
	});

	function check(tag: Tag, checked: boolean){
		if(checked)
			selectedTags.push(tag);
		else {
			const index = selectedTags.findIndex(x => x.uuid === tag.uuid);
			if(index > -1)
				selectedTags.splice(index, 1);
		}
	}
</script>

<template>
	<IonModal class="tag-select-modal" :breakpoints="[0,0.75,1]" initialBreakpoint="1">
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
				<IonItem button v-for="tag in tags" :key="tag.uuid">
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