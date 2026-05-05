<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonLabel, IonListHeader, IonTitle, IonToolbar, IonBackButton, IonItem, IonSelect, IonSelectOption, IonInput, IonToggle, IonIcon } from "@ionic/vue";
	import { onMounted, shallowRef, useTemplateRef, watch } from "vue";

	import { appConfig } from "../../lib/config";
	import { getSystem } from "../../lib/db/tables/system";
	import SystemSelect from "../../modals/SystemSelect.vue";
	import { System } from "../../lib/db/entities";
	import { languagePicker } from "../../lib/util/misc";

	import languageMD from "@material-symbols/svg-600/outlined/language.svg";
	import timerMD from "@material-symbols/svg-600/outlined/timer_off.svg";
	import membersBeforeMD from "@material-symbols/svg-600/outlined/person_text.svg";
	import peopleMD from "@material-symbols/svg-600/outlined/group.svg";
	import journalMD from "@material-symbols/svg-600/outlined/book.svg";
	import homeMD from "@material-symbols/svg-600/outlined/home.svg";
	import SystemItem from "../../components/system/SystemItem.vue";
	import DashboardSettings from "../../modals/DashboardSettings.vue";

	const defaultSystem = shallowRef<System>({
		uuid: appConfig.defaultSystem,
		name: "",
		isArchived: false,
		isPinned: false,
		viewInLists: true
	});
	const systemSelectModal = useTemplateRef("systemSelectModal");
	const dashboardSettingsModal = useTemplateRef("dashboardSettingsModal");

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
				<IonItem button detail @click="languagePicker().then(res => { if(res) appConfig.locale.language = res; })">
					<IonIcon slot="start" :icon="languageMD" />
					<IonLabel>
						<h3>{{ $t("appSettings:locale.language") }}</h3>
						<p>{{ $t("other:languageName.local") }} ({{ $t("other:languageName.inEnglish") }})</p>
					</IonLabel>
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
					<IonIcon v-if="appConfig.view === 'members'" slot="start" :icon="peopleMD" />
					<IonIcon v-if="appConfig.view === 'journal'" slot="start" :icon="journalMD" />
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

				<IonItem button detail @click="dashboardSettingsModal?.$el.present()">
					<IonIcon slot="start" :icon="homeMD" />
					<IonLabel>{{ $t("appSettings:dashboard.title") }}</IonLabel>
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
				v-model="defaultSystem"
				:discard-on-select="true"
				:hide-checkboxes="true"
			/>

			<DashboardSettings ref="dashboardSettingsModal" />

		</IonContent>
	</IonPage>
</template>

<style scoped>
	.clock-style, .first-day {
		gap: 1em;
		display: flex;
		flex-direction: column;
	}
</style>