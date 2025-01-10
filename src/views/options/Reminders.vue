<script setup lang="ts">
	import { IonContent, IonHeader, IonFab, IonListHeader, IonFabButton, IonIcon, IonList, IonPage, IonTitle, IonToolbar, IonBackButton} from '@ionic/vue';
	import { inject } from 'vue';
	import { addOutline as addIOS } from "ionicons/icons";

	import addMD from "@material-design-icons/svg/outlined/add.svg";

	const isIOS = inject<boolean>("isIOS");
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:reminders.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonListHeader>
				<IonLabel>
					{{ $t("options:reminders.eventBasedLocale") }}
				</IonLabel>
			</IonListHeader>
			
			<IonList :inset="isIOS"></IonList>

			<IonListHeader>
				<IonLabel>
					{{ $t("options:reminders.periodicLocale") }}
				</IonLabel>
			</IonListHeader>

			<IonList :inset="isIOS"></IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton>
					<IonIcon :ios="addIOS" :md="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>
