<script setup lang="ts">

	import {
		IonCard,
		IonCardHeader,
		IonCardTitle,
		IonCardContent
	} from "@ionic/vue";

</script>

<template>
	<IonCard color="warning">
		<IonCardHeader>
			<IonCardTitle>Warning</IonCardTitle>
		</IonCardHeader>

		<IonCardContent>
			Ampersand cannot store data persistently on your device.
			If you're on Firefox, please give Ampersand permission to do so.
			If you're on Chrome, please install Ampersand as a web app / add it to your Desktop/Home screen.
			
			If this message doesn't go away, consider backing up your data often from the Import/Export section.
		</IonCardContent>
  </IonCard>
</template>
