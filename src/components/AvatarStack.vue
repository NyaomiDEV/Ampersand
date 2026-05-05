<script setup lang="ts">
	import Avatar from "./Avatar.vue";

	const props = defineProps<{
		avatars: InstanceType<typeof Avatar>["$props"][]
	}>();
</script>

<template>
	<div class="avatar-stack">
		<Avatar
			v-if="props.avatars[0]"
			class="first-avatar"
			v-bind="props.avatars[0]"
		/>
		<Avatar
			v-if="props.avatars[1]"
			class="second-avatar"
			v-bind="props.avatars[1]"
		/>
		<Avatar
			v-if="props.avatars[2]"
			class="third-avatar"
			v-bind="props.avatars[2]"
		/>
	</div>
</template>

<style scoped>
	div.avatar-stack {
		position: relative;
		display: flex;
		align-items: center;

		> * {
			flex-shrink: 0;
			flex-grow: 1;
		}
	}

	.first-avatar:has(+ .second-avatar) {
		z-index: 1;
		margin-inline-end: -40px;
	}

	.second-avatar {
		width: 52px;
		height: 52px;
		z-index: 0;

		&:has(+ .third-avatar) {
			margin-inline-end: -36px;
		}
	}
	
	.third-avatar {
		width: 48px;
		height: 48px;
		z-index: -1;
	}
</style>