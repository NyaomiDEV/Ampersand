<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonLabel, IonListHeader, IonTitle, IonToolbar, IonBackButton, IonItem, IonSegment, IonSelect, IonSelectOption, IonInput } from '@ionic/vue';
	import { inject, ref, watch } from 'vue';

	import NotDoneYet from "../../components/NotDoneYet.vue";
	import { appConfig } from '../../lib/config';
	import MD3SegmentButton from '../../components/MD3SegmentButton.vue';

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";

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
				<IonBackButton slot="start" :text="isIOS ? $t('other:back') : undefined" :icon="!isIOS ? backMD : undefined" defaultHref="/options/" />
				<IonTitle>
					{{ $t("appSettings:header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<NotDoneYet v-if="false"/>

			<IonListHeader>
				<IonLabel>{{ $t("appSettings:localeLabel") }}</IonLabel>
			</IonListHeader>

			<IonList :inset="isIOS">

				<IonItem>
					<IonSelect :label="$t('appSettings:locale.language')" interface="popover" v-model="appConfig.locale.language" :value="appConfig.locale.language || 'en'">
						<IonSelectOption :value="lng" v-for="lng in Object.keys($i18next.services.resourceStore.data)" :key="lng">
							{{ $t("other:languageName.local", { lng }) }} ({{ $t("other:languageName.inEnglish", { lng }) }})
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem>
					<IonLabel>
						<h3 class="centered-text">{{ $t("appSettings:locale.clock.title") }}</h3>
						<IonSegment class="segment-alt" v-model="twelveHourClock">
							<MD3SegmentButton value="true">
								<IonLabel>{{ $t("appSettings:locale.clock.12h") }}</IonLabel>
							</MD3SegmentButton>

							<MD3SegmentButton value="false">
								<IonLabel>{{ $t("appSettings:locale.clock.24h") }}</IonLabel>
							</MD3SegmentButton>
						</IonSegment>
					</IonLabel>
				</IonItem>

				<IonItem>
					<IonLabel>
						<h3 class="centered-text">{{ $t("appSettings:locale.firstDayOfWeek") }}</h3>
						<IonSegment class="segment-alt" v-model="firstWeekOfDayIsSunday">
							<MD3SegmentButton value="true">
								<IonLabel>{{ $t("other:timeSizes.weekdays.sunday") }}</IonLabel>
							</MD3SegmentButton>

							<MD3SegmentButton value="false">
								<IonLabel>{{ $t("other:timeSizes.weekdays.monday") }}</IonLabel>
							</MD3SegmentButton>
						</IonSegment>
					</IonLabel>
				</IonItem>

			</IonList>

			<IonListHeader>
				<IonLabel>{{ $t("appSettings:behaviorLabel") }}</IonLabel>
			</IonListHeader>

			<IonList :inset="isIOS">
				<IonItem>
					<IonSelect :label="$t('appSettings:view')" interface="popover" v-model="appConfig.view">
						<IonSelectOption value="dashboard">
							{{ $t("dashboard:header") }}
						</IonSelectOption>
						<IonSelectOption value="members">
							{{ $t("members:header") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>
			</IonList>

			<IonListHeader>
				<IonLabel>{{ $t("appSettings:defaultFilterLabel") }}</IonLabel>
			</IonListHeader>

			<IonList :inset="isIOS">
				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating" :label="$t('members:header')" v-model="appConfig.defaultFilterQueries.members" />
				</IonItem>
				
				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating" :label="$t('journal:header')" v-model="appConfig.defaultFilterQueries.journal" />
				</IonItem>

				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating" :label="$t('tagManagement:header')" v-model="appConfig.defaultFilterQueries.tags" />
				</IonItem>

				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating" :label="$t('frontHistory:header')" v-model="appConfig.defaultFilterQueries.frontingHistory" />
				</IonItem>

				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating" :label="$t('messageBoard:header')" v-model="appConfig.defaultFilterQueries.messageBoard" />
				</IonItem>

				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating" :label="$t('assetManager:header')" v-model="appConfig.defaultFilterQueries.assetManager" />
				</IonItem>

				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" labelPlacement="floating" :label="$t('customFields:header')" v-model="appConfig.defaultFilterQueries.customFields" />
				</IonItem>
			</IonList>

		</IonContent>
	</IonPage>
</template>
