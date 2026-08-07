<script setup lang="ts">
	import Avatar from "./Avatar.vue";

	const props = defineProps<{
		avatars: InstanceType<typeof Avatar>["$props"][],
		normalStack?: boolean
	}>();
</script>

<template>
	<div :class="{ 'avatar-stack': true, 'normal-stack': props.normalStack }">
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
		--gap: 30px;
		position: relative;
		display: flex;
		align-items: center;

		&:not(.normal-stack){
			width: 56px;
			height: 56px;

			&:has(:nth-child(2)) > * {
				width: 46px;
				height: 46px;
			}

			&:has(:nth-child(3)) > * {
				width: 38px;
				height: 38px;
			}
		}

		> * {
			flex-shrink: 0;
			flex-grow: 0;
		}
	}

	.first-avatar:has(+ .second-avatar) {
		z-index: 1;
		margin-inline-end: calc(var(--gap) * -1);
	}

	.second-avatar {
		z-index: 0;

		&:has(+ .third-avatar) {
			margin-inline-end: calc(var(--gap) * -1);
		}
	}
	
	.third-avatar {
		z-index: -1;
	}
</style>