<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonLabel, IonListHeader, IonTitle, IonToolbar, IonBackButton, IonItem, IonToggle, IonSegment, IonSelect, IonSelectOption, IonInput } from '@ionic/vue';
	import { inject, ref, watch } from 'vue';

	import NotDoneYet from "../../components/NotDoneYet.vue";
	import { appConfig } from '../../lib/config';
	import MD3SegmentButton from '../../components/MD3SegmentButton.vue';

	const twelveHourClock = ref(appConfig.locale.twelveHourClock.toString());
	const firstWeekOfDayIsSunday = ref(appConfig.locale.firstWeekOfDayIsSunday.toString());

	watch(twelveHourClock, () => {
		appConfig.locale.twelveHourClock = twelveHourClock.value === "true" ? true : false
	})

	watch(firstWeekOfDayIsSunday, () => {
		appConfig.locale.firstWeekOfDayIsSunday = firstWeekOfDayIsSunday.value === "true" ? true : false
	})

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
					<IonLabel>
						<h3 class="centered-text">{{ $t("options:appSettings.locale.clock.title") }}</h3>
						<IonSegment class="segment-alt" v-model="twelveHourClock">
							<MD3SegmentButton value="true">
								<IonLabel>{{ $t("options:appSettings.locale.clock.12h") }}</IonLabel>
							</MD3SegmentButton>

							<MD3SegmentButton value="false">
								<IonLabel>{{ $t("options:appSettings.locale.clock.24h") }}</IonLabel>
							</MD3SegmentButton>
						</IonSegment>
					</IonLabel>
				</IonItem>

				<IonItem>
					<IonLabel>
						<h3 class="centered-text">{{ $t("options:appSettings.locale.firstDayOfWeek.title") }}</h3>
						<IonSegment class="segment-alt" v-model="firstWeekOfDayIsSunday">
							<MD3SegmentButton value="true">
								<IonLabel>{{ $t("options:appSettings.locale.firstDayOfWeek.sunday") }}</IonLabel>
							</MD3SegmentButton>

							<MD3SegmentButton value="false">
								<IonLabel>{{ $t("options:appSettings.locale.firstDayOfWeek.monday") }}</IonLabel>
							</MD3SegmentButton>
						</IonSegment>
					</IonLabel>
				</IonItem>

			</IonList>

			<IonListHeader>
				<IonLabel>{{ $t("options:appSettings.behaviorLabel") }}</IonLabel>
			</IonListHeader>

			<IonList :inset="isIOS">
				<IonItem>
					<IonSelect :label="$t('options:appSettings.view.title')" interface="popover" v-model="appConfig.view">
						<IonSelectOption value="dashboard">
							{{ $t("options:appSettings.view.dashboard") }}
						</IonSelectOption>
						<IonSelectOption value="members">
							{{ $t("options:appSettings.view.members") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating" :label="$t('options:appSettings.defaultFilterQueries.members')" v-model="appConfig.defaultFilterQueries.members" />
				</IonItem>
				
				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating" :label="$t('options:appSettings.defaultFilterQueries.journal')" v-model="appConfig.defaultFilterQueries.journal" />
				</IonItem>

				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating" :label="$t('options:appSettings.defaultFilterQueries.tags')" v-model="appConfig.defaultFilterQueries.tags" />
				</IonItem>

				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating" :label="$t('options:appSettings.defaultFilterQueries.frontingHistory')" v-model="appConfig.defaultFilterQueries.frontingHistory" />
				</IonItem>

				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating" :label="$t('options:appSettings.defaultFilterQueries.messageBoard')" v-model="appConfig.defaultFilterQueries.messageBoard" />
				</IonItem>
			</IonList>

		</IonContent>
	</IonPage>
</template>

<style scoped>
	.md ion-input {
		margin: 16px 0;
	}
</style>