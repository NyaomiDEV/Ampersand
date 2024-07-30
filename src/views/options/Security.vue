<script setup lang="ts">
	import { IonContent, IonHeader, IonLabel, IonItem, IonList, IonPage, IonTitle, IonToolbar, IonToggle, IonBackButton} from '@ionic/vue';
	import { inject } from 'vue';

	const isIOS = inject<boolean>("isIOS");
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:security.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">
				<IonItem>
					<IonToggle>
						<IonLabel>
							<h3>{{ $t("options:security.applock.title") }}</h3>
							<p>{{ $t("options:security.applock.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem button :detail="true">
					<IonLabel>
						<h3>{{ $t("options:security.pin") }}</h3>
					</IonLabel>
				</IonItem>

			</IonList>
		</IonContent>
	</IonPage>
</template>
