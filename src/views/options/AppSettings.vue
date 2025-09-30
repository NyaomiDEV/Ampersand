<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonLabel, IonListHeader, IonTitle, IonToolbar, IonBackButton, IonItem, IonSegment, IonSelect, IonSelectOption, IonInput, IonToggle } from "@ionic/vue";
	import { ref, watch } from "vue";
	import { platform } from "@tauri-apps/plugin-os";

	import NotDoneYet from "../../components/NotDoneYet.vue";
	import { appConfig } from "../../lib/config";
	import MD3SegmentButton from "../../components/MD3SegmentButton.vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";

	const twelveHourClock = ref(appConfig.locale.twelveHourClock.toString());
	const firstWeekOfDayIsSunday = ref(appConfig.locale.firstWeekOfDayIsSunday.toString());

	watch(twelveHourClock, () => {
		appConfig.locale.twelveHourClock = twelveHourClock.value === "true" ? true : false;
	});

	watch(firstWeekOfDayIsSunday, () => {
		appConfig.locale.firstWeekOfDayIsSunday = firstWeekOfDayIsSunday.value === "true" ? true : false;
	});
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					:icon="backMD"
					default-href="/options/"
				/>
				<IonTitle>
					{{ $t("appSettings:header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<NotDoneYet v-if="false" />

			<IonListHeader>
				<IonLabel>{{ $t("appSettings:localeLabel") }}</IonLabel>
			</IonListHeader>

			<IonList>
				<IonItem>
					<IonSelect
						v-model="appConfig.locale.language"
						:label="$t('appSettings:locale.language')"
						interface="popover"
						:value="$i18next.languages.find(x => Object.keys($i18next.services.resourceStore.data).includes(x)) || $i18next.languages.toReversed()[0]"
					>
						<IonSelectOption
							v-for="lng in Object.keys($i18next.services.resourceStore.data)"
							:key="lng"
							:value="lng"
						>
							{{ $t("other:languageName.local", { lng }) }} ({{ $t("other:languageName.inEnglish", { lng }) }})
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem>
					<IonLabel>
						<h3 class="centered-text">{{ $t("appSettings:locale.clock.title") }}</h3>
						<IonSegment v-model="twelveHourClock" class="segment-alt">
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
						<IonSegment v-model="firstWeekOfDayIsSunday" class="segment-alt">
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

			<IonList>
				<IonItem>
					<IonSelect v-model="appConfig.view" :label="$t('appSettings:view')" interface="popover">
						<IonSelectOption value="dashboard">
							{{ $t("dashboard:header") }}
						</IonSelectOption>
						<IonSelectOption value="members">
							{{ $t("members:header") }}
						</IonSelectOption>
						<IonSelectOption value="journal">
							{{ $t("journal:header") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>
			</IonList>

			<IonItem button :detail="false">
				<IonToggle v-model="appConfig.showMembersBeforeCustomFronts">
					<IonLabel class="wrap">
						{{ $t("appSettings:showMembersBeforeCustomFronts") }}
					</IonLabel>
				</IonToggle>
			</IonItem>

			<IonItem button :detail="false">
				<IonToggle v-model="appConfig.showSystemDescriptionInDashboard">
					<IonLabel class="wrap">
						{{ $t("appSettings:showSystemDescriptionInDashboard") }}
					</IonLabel>
				</IonToggle>
			</IonItem>

			<IonItem button :detail="false">
				<IonToggle v-model="appConfig.hideFrontingTimer">
					<IonLabel class="wrap">
						{{ $t("appSettings:hideFrontingTimer") }}
					</IonLabel>
				</IonToggle>
			</IonItem>

			<IonItem v-if="platform() === 'android'" button :detail="false">
				<IonToggle v-model="appConfig.useIPC">
					<IonLabel class="wrap">
						{{ $t("appSettings:useIPC") }}
					</IonLabel>
				</IonToggle>
			</IonItem>

			<IonListHeader>
				<IonLabel>{{ $t("appSettings:defaultFilterLabel") }}</IonLabel>
			</IonListHeader>

			<IonList>
				<IonItem>
					<IonInput
						v-model="appConfig.defaultFilterQueries.members"
						fill="outline"
						label-placement="floating"
						:label="$t('members:header')"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="appConfig.defaultFilterQueries.journal"
						fill="outline"
						label-placement="floating"
						:label="$t('journal:header')"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="appConfig.defaultFilterQueries.tags"
						fill="outline"
						label-placement="floating"
						:label="$t('tagManagement:header')"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="appConfig.defaultFilterQueries.frontingHistory"
						fill="outline"
						label-placement="floating"
						:label="$t('frontHistory:header')"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="appConfig.defaultFilterQueries.messageBoard"
						fill="outline"
						label-placement="floating"
						:label="$t('messageBoard:header')"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="appConfig.defaultFilterQueries.assetManager"
						fill="outline"
						label-placement="floating"
						:label="$t('assetManager:header')"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="appConfig.defaultFilterQueries.customFields"
						fill="outline"
						label-placement="floating"
						:label="$t('customFields:header')"
					/>
				</IonItem>
			</IonList>

		</IonContent>
	</IonPage>
</template>
