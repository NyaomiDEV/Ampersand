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
			<IonCardTitle>{{ $t("other:storagePersistence.header") }}</IonCardTitle>
		</IonCardHeader>
		<IonCardContent>{{ $t("other:storagePersistence.content") }}</IonCardContent>
  </IonCard>
</template>
