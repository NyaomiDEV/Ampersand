<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonLabel, IonListHeader, IonTitle, IonToolbar, IonBackButton, IonItem, IonSegment, IonSelect, IonSelectOption, IonInput, IonToggle, IonAvatar, IonIcon } from "@ionic/vue";
	import { onMounted, ref, shallowRef, useTemplateRef, watch } from "vue";
	import { platform } from "@tauri-apps/plugin-os";

	import { appConfig } from "../../lib/config";
	import { computePercentage } from "../../lib/i18n";
	import { getObjectURL } from "../../lib/util/blob";
	import MD3SegmentButton from "../../components/MD3SegmentButton.vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import accountCircle from "@material-symbols/svg-600/outlined/supervised_user_circle.svg";
	import { getSystem } from "../../lib/db/tables/system";
	import SystemSelect from "../../modals/SystemSelect.vue";
	import { System } from "../../lib/db/entities";

	const defaultSystem = shallowRef<System[]>([{
		uuid: appConfig.defaultSystem,
		name: ""
	}]);
	const systemSelectModal = useTemplateRef("systemSelectModal");
	const twelveHourClock = ref(appConfig.locale.twelveHourClock.toString());
	const firstWeekOfDayIsSunday = ref(appConfig.locale.firstWeekOfDayIsSunday.toString());

	watch(twelveHourClock, () => {
		appConfig.locale.twelveHourClock = twelveHourClock.value === "true" ? true : false;
	});

	watch(firstWeekOfDayIsSunday, () => {
		appConfig.locale.firstWeekOfDayIsSunday = firstWeekOfDayIsSunday.value === "true" ? true : false;
	});

	watch(defaultSystem, () => {
		if(defaultSystem.value[0] && appConfig.defaultSystem !== defaultSystem.value[0].uuid)
			appConfig.defaultSystem = defaultSystem.value[0].uuid;
	});

	onMounted(async () => {
		const _sys = await getSystem(appConfig.defaultSystem);
		if(_sys) defaultSystem.value = [_sys];
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
			<IonListHeader>
				<IonLabel>{{ $t("appSettings:localeLabel") }}</IonLabel>
			</IonListHeader>

			<IonList>
				<IonItem>
					<IonSelect
						v-model="appConfig.locale.language"
						:label="$t('appSettings:locale.language')"
						interface="popover"
						:value="$i18next.languages.find(x => Object.keys($i18next.services.resourceStore.data).includes(x)) || $i18next.languages[0].split('-')[0]"
					>
						<IonSelectOption
							v-for="lng in Object.keys($i18next.services.resourceStore.data)"
							:key="lng"
							:value="lng"
						>
							{{ $t("other:languageName.local", { lng }) }} ({{ $t("other:languageName.inEnglish", { lng }) }}) ({{ computePercentage(lng) }}%)
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

				<IonItem button :detail="true" @click="systemSelectModal?.$el.present()">
					<IonAvatar slot="start">
						<img v-if="defaultSystem[0].image" aria-hidden="true" :src="getObjectURL(defaultSystem[0].image)" />
						<IonIcon v-else :icon="accountCircle" />
					</IonAvatar>
					<IonLabel>
						<p>{{ $t("appSettings:defaultSystem") }}</p>
						<h2>{{ defaultSystem[0].name }}</h2>
					</IonLabel>
				</IonItem>

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
			</IonList>

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

			<SystemSelect
				ref="systemSelectModal"
				v-model="defaultSystem"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="false"
			/>

		</IonContent>
	</IonPage>
</template>

<style scoped>
	ion-icon {
		width: 100%;
		height: 100%;
		color: var(--ion-color-primary);
	}
</style>