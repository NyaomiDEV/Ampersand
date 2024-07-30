<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton} from '@ionic/vue';
	import { inject } from 'vue';

	const isIOS = inject<boolean>("isIOS");
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:about.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">
				<h1 class="centered-text">Ampersand</h1>
				<p class="centered-text">{{ $t("options:about.version") }} 0.0.0 </p>
				<p class="centered-text"> {{ $t("options:about.madein") }}</p>
			</IonList>
		</IonContent>
	</IonPage>
</template>
