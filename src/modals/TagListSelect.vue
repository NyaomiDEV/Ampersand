<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonList,
		IonToolbar,
		IonTitle,
		IonModal,
		IonSearchbar,
	} from "@ionic/vue";

	import { onMounted, onUnmounted, reactive, ref, shallowRef, toRaw, watch } from "vue";
	import { getFilteredTags } from "../lib/db/tables/tags";
	import { Tag } from "../lib/db/entities";
	import TagItem from "../components/tag/TagItem.vue";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import VirtualList from "../components/VirtualList.vue";
	import InfiniteLoader from "../components/InfiniteLoader.vue";
	import { DatabaseEvent, DatabaseEvents } from "../lib/db/events";

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
	const iter = shallowRef(getFilteredTags(search.value));
	const iterDone = ref(false);

	watch(selectedTags, () => {
		emit("update:modelValue",  [...toRaw(selectedTags)]);
	});

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "tags")
			void resetTags();
	};

	watch(search, async () => {
		await resetTags();
	});

	onMounted(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await resetTags();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function resetTags(){
		tags.value = undefined;
		iterDone.value = false;
		iter.value = getFilteredTags(search.value);
		await pollTags();
	}

	async function pollTags(cb?: () => void){
		let i = 0;
		const _tags: Tag[] = [];
		while(true) {
			const data = await iter.value.next();
			if(data.value) _tags.push(data.value);
			i++;
			if(data.done) iterDone.value = true;
			if(i >= 20 || data.done) break;
		}

		if(!tags.value)
			tags.value = _tags;
		else
			tags.value = [...tags.value, ..._tags];

		if(cb)
			cb();
	}

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
				<VirtualList :entries="tags.filter(x => x.type === props.type)" :min-size="56" :gap="2">
					<template #default="{ entry: tag }">
						<TagItem
							button
							:tag
							has-toggle="checkbox"
							:toggle-value="tag.uuid"
							:toggle-checked="!!selectedTags.find(x => x.uuid === tag.uuid)"
							@toggle-update="value => check(tag, value)"
						/>
					</template>
				</VirtualList>
			</IonList>

			<InfiniteLoader v-if="!iterDone" @infinite="pollTags" />

		</IonContent>
	</IonModal>
</template>