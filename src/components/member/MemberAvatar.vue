<script setup lang="ts">
	import {
		IonAvatar,
		IonIcon,
	} from "@ionic/vue";

	import { Member } from '../../lib/db/entities';
	import { getObjectURL } from '../../lib/util/blob';
	import { PartialBy } from "../../lib/types";

	import accountCircle from "@material-symbols/svg-600/outlined/account_circle.svg";
	import { isReactive, ref, watch, WatchStopHandle } from "vue";

	const props = defineProps<{
		member: PartialBy<Member, "uuid" | "dateCreated">,
	}>();

	const cssColor = ref("var(--ion-color-primary)");

	function updateColor() {
		cssColor.value = props.member.color && props.member.color !== "#000000"
			? props.member.color
			: "var(--ion-color-primary)";
	}

	let watchHandle: WatchStopHandle | undefined;
	watch(props, () => {
		updateColor();
		if(isReactive(props.member))
			watchHandle = watch(props.member, updateColor);
		else
			if(watchHandle){
				watchHandle();
				watchHandle = undefined;
			}
	}, { immediate: true });
</script>

<template>
	<IonAvatar class="with-outline">
		<img aria-hidden="true" :src="getObjectURL(props.member.image)" v-if="props.member.image" />
		<IonIcon :icon="accountCircle" v-else />
	</IonAvatar>
</template>

<style scoped>
	ion-avatar.with-outline {
		outline-width: 2px;
		outline-style: solid;
		outline-color: v-bind('cssColor');
	}

	ion-icon {
		width: 100%;
		height: 100%;
		color: v-bind('cssColor');
	}
</style>