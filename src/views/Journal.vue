<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonSearchbar } from '@ionic/vue';
	import { inject, ref, watch } from 'vue';
	import { useRoute } from 'vue-router';

	const route = useRoute();
	const isIOS = inject<boolean>("isIOS");
	const search = ref(route.query.q as string || "");
	watch(route, () => {
		search.value = route.query.q as string || "";
	});
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonTitle>
					{{ $t("journal:header") }}
				</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar
					:animated="true"
					:placeholder="$t('journal:searchPlaceholder')"
					showCancelButton="focus"
					showClearButton="focus"
					:spellcheck="false"
					v-model="search"
				/>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">

			</IonList>
		</IonContent>
	</IonPage>
</template>
