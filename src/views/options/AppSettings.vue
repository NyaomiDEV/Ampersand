<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonLabel, IonListHeader, IonTitle, IonToolbar, IonBackButton, IonItem, IonSelect, IonSelectOption, IonInput, IonToggle, IonIcon } from "@ionic/vue";
	import { inject, onMounted, shallowRef, useTemplateRef, watch } from "vue";
	import { platform } from "@tauri-apps/plugin-os";

	import { accessibilityConfig, appConfig } from "../../lib/config";
	import { getSystem } from "../../lib/db/tables/system";
	import SystemSelect from "../../modals/SystemSelect.vue";
	import { System } from "../../lib/db/entities";
	import { languagePicker } from "../../lib/util/misc";
	import SystemItem from "../../components/system/SystemItem.vue";
	import DashboardSettings from "../../modals/DashboardSettings.vue";
	import TabSettings from "../../modals/TabSettings.vue";
	import { lists } from "../../router/lists";
	import Color from "../../components/Color.vue";

	import languageMD from "@material-symbols/svg-600/rounded/language.svg";
	import timerMD from "@material-symbols/svg-600/rounded/timer_off.svg";
	import membersBeforeMD from "@material-symbols/svg-600/rounded/person_text.svg";
	import homeMD from "@material-symbols/svg-600/rounded/home.svg";
	import dashboardMD from "@material-symbols/svg-600/rounded/dashboard_customize.svg";
	import optionsMD from "@material-symbols/svg-600/rounded/menu.svg";
	import tabsMD from "@material-symbols/svg-600/rounded/bottom_navigation.svg";

	import lightMD from "@material-symbols/svg-600/rounded/wb_sunny.svg";
	import darkMD from "@material-symbols/svg-600/rounded/dark_mode.svg";
	import autoMD from "@material-symbols/svg-600/rounded/routine.svg";

	import tonalMD from "@material-symbols/svg-600/rounded/brightness_5.svg";
	import neutralMD from "@material-symbols/svg-600/rounded/brightness_empty.svg";
	import vibrantMD from "@material-symbols/svg-600/rounded/brightness_7.svg";
	import expressiveMD from "@material-symbols/svg-600/rounded/brightness_6.svg";

	import appColorMD from "@material-symbols/svg-600/rounded/format_paint.svg";
	import systemColorMD from "@material-symbols/svg-600/rounded/devices.svg";
	import customColorMD from "@material-symbols/svg-600/rounded/palette.svg";
	import fontMD from "@material-symbols/svg-600/rounded/brand_family.svg";

	const defaultSystem = shallowRef<System>({
		uuid: appConfig.defaultSystem,
		name: "",
		isArchived: false,
		isPinned: false,
		viewInLists: true
	});
	const systemSelectModal = useTemplateRef("systemSelectModal");
	const dashboardSettingsModal = useTemplateRef("dashboardSettingsModal");
	const tabSettingsModal = useTemplateRef("tabSettingsModal");

	const isDev = inject<boolean>("isDev");

	watch(defaultSystem, () => {
		if(defaultSystem.value && appConfig.defaultSystem !== defaultSystem.value.uuid)
			appConfig.defaultSystem = defaultSystem.value.uuid;
	});

	onMounted(async () => {
		const _sys = await getSystem(appConfig.defaultSystem);
		if(_sys) defaultSystem.value = _sys;
	});

	function mapToIcon(view: string){
		switch(view){
			case "dashboard":
				return homeMD;
			case "options":
				return optionsMD;
			default:
				return lists[view].icon;
		}
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					default-href="/tab/options/"
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
				<IonItem button detail @click="languagePicker().then(res => { if(res) appConfig.locale.language = res; })">
					<IonIcon slot="start" :icon="languageMD" />
					<IonLabel>
						<h3>{{ $t("appSettings:locale.language") }}</h3>
						<p>{{ $t("other:languageName.local") }} ({{ $t("other:languageName.inEnglish") }})</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonListHeader>
				<IonLabel>{{ $t("appSettings:appearanceLabel") }}</IonLabel>
			</IonListHeader>

			<IonList>
				<IonItem>
					<IonIcon v-if="appConfig.theme === 'auto'" slot="start" :icon="autoMD" />
					<IonIcon v-if="appConfig.theme === 'light'" slot="start" :icon="lightMD" />
					<IonIcon v-if="appConfig.theme === 'dark'" slot="start" :icon="darkMD" />
					<IonSelect
						v-model="appConfig.theme"
						label-placement="floating"
						:label="$t('appSettings:uiVariant.title')"
						:cancel-text="$t('other:alerts.cancel')"
						interface="action-sheet"
					>
						<IonSelectOption value="auto">
							{{ $t("appSettings:uiVariant.auto") }}
						</IonSelectOption>
						<IonSelectOption value="light">
							{{ $t("appSettings:uiVariant.light") }}
						</IonSelectOption>
						<IonSelectOption value="dark">
							{{ $t("appSettings:uiVariant.dark") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem>
					<IonIcon v-if="appConfig.themeScheme === 'tonal-spot'" slot="start" :icon="tonalMD" />
					<IonIcon v-if="appConfig.themeScheme === 'neutral'" slot="start" :icon="neutralMD" />
					<IonIcon v-if="appConfig.themeScheme === 'vibrant'" slot="start" :icon="vibrantMD" />
					<IonIcon v-if="appConfig.themeScheme === 'expressive'" slot="start" :icon="expressiveMD" />
					<IonSelect
						v-model="appConfig.themeScheme"
						label-placement="floating"
						:label="$t('appSettings:themeScheme.title')"
						:cancel-text="$t('other:alerts.cancel')"
						interface="action-sheet"
					>
						<IonSelectOption value="tonal-spot">
							{{ $t("appSettings:themeScheme.tonalSpot") }}
						</IonSelectOption>
						<IonSelectOption value="neutral">
							{{ $t("appSettings:themeScheme.neutral") }}
						</IonSelectOption>
						<IonSelectOption value="vibrant">
							{{ $t("appSettings:themeScheme.vibrant") }}
						</IonSelectOption>
						<IonSelectOption value="expressive">
							{{ $t("appSettings:themeScheme.expressive") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem>
					<IonIcon v-if="appConfig.colors === 'app'" slot="start" :icon="appColorMD" />
					<IonIcon v-if="appConfig.colors === 'system'" slot="start" :icon="systemColorMD" />
					<IonIcon v-if="appConfig.colors === 'custom'" slot="start" :icon="customColorMD" />
					<IonSelect
						v-model="appConfig.colors"
						label-placement="floating"
						:label="$t('appSettings:colors.title')"
						:cancel-text="$t('other:alerts.cancel')"
						interface="action-sheet"
					>
						<IonSelectOption value="app">
							{{ $t("appSettings:colors.app") }}
						</IonSelectOption>
						<IonSelectOption v-if="platform() === 'android'" value="system">
							{{ $t("appSettings:colors.system") }}
						</IonSelectOption>
						<IonSelectOption value="custom">
							{{ $t("appSettings:colors.custom") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem v-if="appConfig.colors === 'custom'" button :detail="false">
					<Color v-model="appConfig.customColors.accentColor">
						<IonLabel>
							<h3>{{ $t("appSettings:accentColor.title") }}</h3>
						</IonLabel>
					</Color>
				</IonItem>

				<IonItem v-if="appConfig.colors === 'custom'" button :detail="false">
					<Color v-model="appConfig.customColors.backgroundColor">
						<IonLabel>
							<h3>{{ $t("appSettings:backgroundColor.title") }}</h3>
						</IonLabel>
					</Color>
				</IonItem>

				<IonItem :disabled="accessibilityConfig.highLegibility">
					<IonIcon slot="start" :icon="fontMD" />
					<IonSelect
						v-model="appConfig.fontStyle"
						label-placement="floating"
						:label="$t('appSettings:fontStyle.title')"
						:cancel-text="$t('other:alerts.cancel')"
						interface="action-sheet"
					>
						<IonSelectOption value="default">
							{{ $t("appSettings:fontStyle.default") }} 
						</IonSelectOption>
						<IonSelectOption value="modern">
							{{ $t("appSettings:fontStyle.modern") }}
						</IonSelectOption>
						<IonSelectOption value="digital">
							{{ $t("appSettings:fontStyle.digital") }}
						</IonSelectOption>
						<IonSelectOption value="round">
							{{ $t("appSettings:fontStyle.round") }}
						</IonSelectOption>
						<IonSelectOption value="newspaper">
							{{ $t("appSettings:fontStyle.newspaper") }}
						</IonSelectOption>
						<IonSelectOption value="mystic">
							{{ $t("appSettings:fontStyle.mystic") }}
						</IonSelectOption>
						<IonSelectOption value="classy">
							{{ $t("appSettings:fontStyle.classy") }}
						</IonSelectOption>
						<IonSelectOption v-if="isDev" value="boring">
							{{ $t("appSettings:fontStyle.boring") }}
						</IonSelectOption>
						<IonSelectOption v-if="isDev" value="techbro">
							{{ $t("appSettings:fontStyle.techbro+") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>
				<IonItem button detail @click="dashboardSettingsModal?.$el.present()">
					<IonIcon slot="start" :icon="dashboardMD" />
					<IonLabel>{{ $t("appSettings:dashboard.title") }}</IonLabel>
				</IonItem>

				<IonItem button detail @click="tabSettingsModal?.$el.present()">
					<IonIcon slot="start" :icon="tabsMD" />
					<IonLabel>{{ $t("appSettings:tabSettings") }}</IonLabel>
				</IonItem>
			</IonList>

			<IonListHeader>
				<IonLabel>{{ $t("appSettings:behaviorLabel") }}</IonLabel>
			</IonListHeader>

			<IonList>
				<SystemItem
					v-if="defaultSystem"
					button
					detail
					:show-cover="false"
					:show-effects="false"
					:show-icons="false"
					:system="defaultSystem"
					@click="systemSelectModal?.$el.present()"
				>
					<template #before>
						<p>{{ $t("appSettings:defaultSystem") }}</p>
					</template>
				</SystemItem>
				<IonItem
					v-else
					button
					detail
					@click="systemSelectModal?.$el.present()"
				>
					<IonLabel>
						<p>{{ $t("appSettings:defaultSystem") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem>
					<IonIcon slot="start" :icon="mapToIcon(appConfig.view)" />
					<IonSelect
						v-model="appConfig.view"
						label-placement="floating"
						:label="$t('appSettings:view')"
						:cancel-text="$t('other:alerts.cancel')"
						interface="action-sheet"
					>
						<IonSelectOption
							v-for="[path, route] in Object.entries(lists).filter(x => appConfig.tabOrder.includes(x[0]))"
							:key="route.name"
							:value="path"
						>
							{{ $t(`${path}:header`) }}
						</IonSelectOption>
						<IonSelectOption value="dashboard">
							{{ $t("dashboard:header") }}
						</IonSelectOption>
						<IonSelectOption value="options">
							{{ $t("options:header") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem>
					<IonIcon slot="start" :icon="membersBeforeMD" />
					<IonSelect
						v-model="appConfig.showMembersApartFromCustomFronts"
						label-placement="floating"
						:label="$t('appSettings:showMembersApartFromCustomFronts.title')"
						:cancel-text="$t('other:alerts.cancel')"
						interface="action-sheet"
					>
						<IonSelectOption value="off">
							{{ $t("appSettings:showMembersApartFromCustomFronts.off") }}
						</IonSelectOption>
						<IonSelectOption value="before">
							{{ $t("appSettings:showMembersApartFromCustomFronts.before") }}
						</IonSelectOption>
						<IonSelectOption value="after">
							{{ $t("appSettings:showMembersApartFromCustomFronts.after") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem button :detail="false">
					<IonIcon slot="start" :icon="timerMD" />
					<IonToggle v-model="appConfig.hideFrontingTimer">
						<IonLabel>
							{{ $t("appSettings:hideFrontingTimer") }}
						</IonLabel>
					</IonToggle>
				</IonItem>


			</IonList>

			<IonListHeader>
				<IonLabel>{{ $t("appSettings:defaultFilterLabel") }}</IonLabel>
			</IonListHeader>

			<IonList class="surface">
				<IonItem>
					<IonInput
						v-model="appConfig.defaultFilterQueries.systems"
						fill="solid"
						label-placement="floating"
						:label="$t('systems:header')"
					/>
				</IonItem>
				<IonItem>
					<IonInput
						v-model="appConfig.defaultFilterQueries.members"
						fill="solid"
						label-placement="floating"
						:label="$t('members:header')"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="appConfig.defaultFilterQueries.journal"
						fill="solid"
						label-placement="floating"
						:label="$t('journal:header')"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="appConfig.defaultFilterQueries.tags"
						fill="solid"
						label-placement="floating"
						:label="$t('tagManagement:header')"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="appConfig.defaultFilterQueries.frontingHistory"
						fill="solid"
						label-placement="floating"
						:label="$t('frontHistory:header')"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="appConfig.defaultFilterQueries.messageBoard"
						fill="solid"
						label-placement="floating"
						:label="$t('messageBoard:header')"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="appConfig.defaultFilterQueries.assetManager"
						fill="solid"
						label-placement="floating"
						:label="$t('assetManager:header')"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="appConfig.defaultFilterQueries.customFields"
						fill="solid"
						label-placement="floating"
						:label="$t('customFields:header')"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="appConfig.defaultFilterQueries.notes"
						fill="solid"
						label-placement="floating"
						:label="$t('notes:header')"
					/>
				</IonItem>
			</IonList>

			<SystemSelect
				ref="systemSelectModal"
				:model-value="[defaultSystem]"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="false"
				@update:model-value="e => { if(e[0]) defaultSystem = e[0] }"
			/>

			<DashboardSettings ref="dashboardSettingsModal" />
			<TabSettings ref="tabSettingsModal" />

		</IonContent>
	</IonPage>
</template>