<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonLabel, IonListHeader, IonTitle, IonToolbar, IonBackButton, IonItem, IonSelect, IonSelectOption, IonInput, IonToggle, IonIcon } from "@ionic/vue";
	import { onMounted, shallowRef, useTemplateRef, watch } from "vue";

	import { accessibilityConfig, appConfig } from "../../lib/config";
	import { getSystem } from "../../lib/db/tables/system";
	import SystemSelect from "../../modals/SystemSelect.vue";
	import { System } from "../../lib/db/entities";
	import { languagePicker } from "../../lib/util/misc";
	import SystemItem from "../../components/system/SystemItem.vue";
	import DashboardSettings from "../../modals/DashboardSettings.vue";
	import TabSettings from "../../modals/TabSettings.vue";
	import { lists } from "../../router/lists";

	import languageMD from "@material-symbols/svg-600/rounded/language.svg";
	import timerMD from "@material-symbols/svg-600/rounded/timer_off.svg";
	import membersBeforeMD from "@material-symbols/svg-600/rounded/person_text.svg";
	import homeMD from "@material-symbols/svg-600/rounded/home.svg";
	import dashboardMD from "@material-symbols/svg-600/rounded/dashboard_customize.svg";
	import tabsMD from "@material-symbols/svg-600/rounded/bottom_navigation.svg";
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

	watch(defaultSystem, () => {
		if(defaultSystem.value && appConfig.defaultSystem !== defaultSystem.value.uuid)
			appConfig.defaultSystem = defaultSystem.value.uuid;
	});

	onMounted(async () => {
		const _sys = await getSystem(appConfig.defaultSystem);
		if(_sys) defaultSystem.value = _sys;
	});
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
						<IonSelectOption value="bold">
							{{ $t("appSettings:fontStyle.bold") }}
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
					<IonIcon v-if="appConfig.view === 'dashboard'" slot="start" :icon="homeMD" />
					<IonIcon v-if="appConfig.view === 'members'" slot="start" :icon="lists.members.icon" />
					<IonIcon v-if="appConfig.view === 'journal'" slot="start" :icon="lists.journal.icon" />
					<IonSelect
						v-model="appConfig.view"
						label-placement="floating"
						:label="$t('appSettings:view')"
						:cancel-text="$t('other:alerts.cancel')"
						interface="action-sheet"
					>
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