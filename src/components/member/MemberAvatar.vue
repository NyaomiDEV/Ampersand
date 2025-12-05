<script setup lang="ts">
	import {
		IonAvatar,
		IonIcon,
	} from "@ionic/vue";

	import { Member, SQLFile } from "../../lib/db/entities";
	import { getObjectURL } from "../../lib/util/blob";

	import accountCircle from "@material-symbols/svg-600/outlined/account_circle.svg";
	import { isReactive, ref, watch, WatchStopHandle } from "vue";

	const props = defineProps<{
		member: Member,
	}>();

	const avatarColor = ref("var(--ion-color-primary)");
	const avatarUri = ref();

	function updateColor() {
		avatarColor.value = props.member.color?.slice(0, 7) ?? "var(--ion-color-primary)";
	}

	async function updateAvatarUri() {
		if(props.member.image) avatarUri.value = await getObjectURL(props.member?.image as SQLFile);
	}

	let watchHandle: WatchStopHandle | undefined;
	watch(props, async () => {
		updateColor();
		await updateAvatarUri();
		if(isReactive(props.member)){
			watchHandle = watch(props.member, async () => {
				updateColor();
				await updateAvatarUri();
			});
		} else
			if(watchHandle){
				watchHandle();
				watchHandle = undefined;
			}
	}, { immediate: true });
</script>

<template>
	<IonAvatar class="with-outline">
		<img v-if="avatarUri" aria-hidden="true" :src="avatarUri" />
		<IonIcon v-else :icon="accountCircle" />
	</IonAvatar>
</template>

<style scoped>
	ion-avatar.with-outline {
		outline-width: 2px;
		outline-style: solid;
		outline-color: v-bind('avatarColor');
	}

	ion-icon {
		width: 100%;
		height: 100%;
		color: v-bind('avatarColor');
	}
</style>