<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonLabel, IonListHeader, IonTitle, IonToolbar, IonBackButton, IonItem, IonToggle } from '@ionic/vue';
	import { inject, reactive, watch } from 'vue';

	import NotDoneYet from "../../components/NotDoneYet.vue";
	import { getConfigEntry, saveConfig } from '../../lib/config';
	import { AppConfig } from '../../lib/config/types';

	const config = reactive(getConfigEntry("app") as AppConfig);
	watch(config, () => {
		saveConfig({
			app: { ...config }
		});
	});

	const isIOS = inject<boolean>("isIOS");
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:appSettings.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<NotDoneYet v-if="false"/>

			<IonListHeader>
				<IonLabel>{{ $t("options:appSettings.localeLabel") }}</IonLabel>
			</IonListHeader>

			<IonList :inset="isIOS">

				<IonItem button disabled>
					<IonLabel>
						<h3>{{ $t("options:appSettings.locale.language") }}</h3>
						<p>{{ $t("other:languageName.local") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem>
					<IonToggle v-model="config.locale.TwelveHourClock">
						<IonLabel>
							<h3>{{ $t("options:appSettings.locale.clock.title") }}</h3>
							<p>{{ config.locale.TwelveHourClock ? $t("options:appSettings.locale.clock.12h") : $t("options:appSettings.locale.clock.24h") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonToggle v-model="config.locale.firstWeekOfDayIsSunday">
						<IonLabel>
							<h3>{{ $t("options:appSettings.locale.firstDayOfWeek.title") }}</h3>
							<p>{{ config.locale.firstWeekOfDayIsSunday ? $t("options:appSettings.locale.firstDayOfWeek.sunday") : $t("options:appSettings.locale.firstDayOfWeek.monday") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

			</IonList>

		</IonContent>
	</IonPage>
</template>
