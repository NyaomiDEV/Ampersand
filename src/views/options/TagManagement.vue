<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment, IonSegmentButton, IonLabel} from '@ionic/vue';
	import { inject, ref } from 'vue';

	const isIOS = inject<boolean>("isIOS");

	const currentTags = ref("member");
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:tagManagement.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonSegment v-model="currentTags" value="member">
				<IonSegmentButton value="member">
					<IonLabel>{{ $t("options:tagManagement.selector.member") }}</IonLabel>
				</IonSegmentButton>
				<IonSegmentButton value="journal">
					<IonLabel>{{ $t("options:tagManagement.selector.journal") }}</IonLabel>
				</IonSegmentButton>
			</IonSegment>
			<IonList :inset="isIOS">

			</IonList>
		</IonContent>
	</IonPage>
</template>
