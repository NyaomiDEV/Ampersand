<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonList,
		IonToolbar,
		IonTitle,
		IonItem,
		IonModal,
		IonSearchbar,
		IonCheckbox,
	} from "@ionic/vue";

	import { onBeforeMount, reactive, ref, shallowRef, toRaw, watch } from "vue";
	import { getFilteredTags } from "../lib/db/tables/tags";
	import { Tag } from "../lib/db/entities";
	import TagColor from "../components/tag/TagColor.vue";
	import TagLabel from "../components/tag/TagLabel.vue";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import VirtualList from "../components/VirtualList.vue";

	const props = defineProps<{
		customTitle?: string,
		type: "member" | "journal"
		modelValue?: Tag[]
	}>();

	const emit = defineEmits<{
		"update:modelValue": [Tag[]],
	}>();

	const selectedTags = reactive<Tag[]>([...props.modelValue || []]);
	const search = ref("");
	const tags = shallowRef<Tag[]>();

	watch(selectedTags, () => {
		emit("update:modelValue",  [...toRaw(selectedTags)]);
	});

	watch(search, async () => {
		tags.value = (await Array.fromAsync(getFilteredTags(search.value))).filter(x => x.type === props.type).sort((a, b) => a.name.localeCompare(b.name));
	});

	onBeforeMount(async () => {
		tags.value = (await Array.fromAsync(getFilteredTags(search.value))).filter(x => x.type === props.type).sort((a, b) => a.name.localeCompare(b.name));
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
	<IonModal class="tag-select-modal" :breakpoints="[0,0.75,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ props.customTitle ?? $t("tagManagement:select") }}</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar
					:animated="true"
					:placeholder="$t('tagManagement:searchPlaceholder')"
					show-cancel-button="focus"
					show-clear-button="focus"
					:spellcheck="false"
					:value="search"
					@ion-change="e => search = e.detail.value || ''"
				/>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="!tags" />
		<IonContent v-else>
			<IonList>
				<VirtualList :entries="tags" :min-size="56" :gap="2">
					<template #default="{ entry: tag }">
						<IonItem button>
							<TagColor slot="start" :tag />
							<IonCheckbox :value="tag.uuid" :checked="!!selectedTags.find(x => x.uuid === tag.uuid)" @update:model-value="value => check(tag, value)">
								<TagLabel :tag />
							</IonCheckbox>
						</IonItem>
					</template>
				</VirtualList>
			</IonList>
		</IonContent>
	</IonModal>
</template>