<script setup lang="ts">
	import { IonContent, IonHeader, IonItem, IonRange, IonLabel, IonToggle, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSelect, IonSelectOption, IonIcon } from "@ionic/vue";
	import { accessibilityConfig } from "../../lib/config";
	import { platform } from "@tauri-apps/plugin-os";
	import Color from "../../components/Color.vue";

	import lowContrastMD from "@material-symbols/svg-600/rounded/brightness_1.svg";
	import highContrastMD from "@material-symbols/svg-600/rounded/contrast.svg";
	import amoledMD from "@material-symbols/svg-600/rounded/night_sight_max.svg";
	import vibrantMD from "@material-symbols/svg-600/rounded/brightness_7.svg";
	import fontMD from "@material-symbols/svg-600/rounded/format_size.svg";
	import smallTextMD from "@material-symbols/svg-600/rounded/text_decrease.svg";
	import bigTextMD from "@material-symbols/svg-600/rounded/text_increase.svg";
	import customColorMD from "@material-symbols/svg-600/rounded/palette.svg";
	import colorsMD from "@material-symbols/svg-600/rounded/colors.svg";
	import borderMD from "@material-symbols/svg-600/rounded/border_color.svg";
	import compactMD from "@material-symbols/svg-600/rounded/list_alt.svg";
	import hideCoverMD from "@material-symbols/svg-600/rounded/hide_image.svg";
	import motionMD from "@material-symbols/svg-600/rounded/masked_transitions.svg";
	import lightMD from "@material-symbols/svg-600/rounded/wb_sunny.svg";
	import darkMD from "@material-symbols/svg-600/rounded/dark_mode.svg";
	import autoMD from "@material-symbols/svg-600/rounded/routine.svg";
	import frontingNotificationMD from "@material-symbols/svg-600/rounded/notifications_unread.svg";
	import appColorMD from "@material-symbols/svg-600/rounded/colorize.svg";
	import systemColorMD from "@material-symbols/svg-600/rounded/devices.svg";
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" default-href="/options/" />
				<IonTitle>
					{{ $t("accessibility:header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>

			<IonList>
				<IonItem>
					<IonIcon v-if="accessibilityConfig.theme === 'auto'" slot="start" :icon="autoMD" />
					<IonIcon v-if="accessibilityConfig.theme === 'light'" slot="start" :icon="lightMD" />
					<IonIcon v-if="accessibilityConfig.theme === 'dark'" slot="start" :icon="darkMD" />
					<IonSelect
						v-model="accessibilityConfig.theme"
						label-placement="floating"
						:label="$t('accessibility:uiVariant.title')"
						:cancel-text="$t('other:alerts.cancel')"
						interface="action-sheet"
					>
						<IonSelectOption value="auto">
							{{ $t("accessibility:uiVariant.auto") }}
						</IonSelectOption>
						<IonSelectOption value="light">
							{{ $t("accessibility:uiVariant.light") }}
						</IonSelectOption>
						<IonSelectOption value="dark">
							{{ $t("accessibility:uiVariant.dark") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem v-if="accessibilityConfig.theme === 'dark' || accessibilityConfig.theme === 'auto'">
					<IonIcon slot="start" :icon="amoledMD" />
					<IonToggle v-model="accessibilityConfig.themeIsAmoled">
						<IonLabel>
							<h3>{{ $t("accessibility:themeIsAmoled.title") }}</h3>
							<p>{{ $t("accessibility:themeIsAmoled.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonIcon slot="start" :icon="vibrantMD" />
					<IonSelect
						v-model="accessibilityConfig.themeScheme"
						label-placement="floating"
						:label="$t('accessibility:themeScheme.title')"
						:cancel-text="$t('other:alerts.cancel')"
						interface="action-sheet"
					>
						<IonSelectOption value="tonal-spot">
							{{ $t("accessibility:themeScheme.tonalSpot") }}
						</IonSelectOption>
						<IonSelectOption value="neutral">
							{{ $t("accessibility:themeScheme.neutral") }}
						</IonSelectOption>
						<IonSelectOption value="vibrant">
							{{ $t("accessibility:themeScheme.vibrant") }}
						</IonSelectOption>
						<IonSelectOption value="expressive">
							{{ $t("accessibility:themeScheme.expressive") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem>
					<IonIcon v-if="accessibilityConfig.colors === 'app'" slot="start" :icon="appColorMD" />
					<IonIcon v-if="accessibilityConfig.colors === 'system'" slot="start" :icon="systemColorMD" />
					<IonIcon v-if="accessibilityConfig.colors === 'custom'" slot="start" :icon="customColorMD" />
					<IonSelect
						v-model="accessibilityConfig.colors"
						label-placement="floating"
						:label="$t('accessibility:colors.title')"
						:cancel-text="$t('other:alerts.cancel')"
						interface="action-sheet"
					>
						<IonSelectOption value="app">
							{{ $t("accessibility:colors.app") }}
						</IonSelectOption>
						<IonSelectOption v-if="platform() === 'android'" value="system">
							{{ $t("accessibility:colors.system") }}
						</IonSelectOption>
						<IonSelectOption value="custom">
							{{ $t("accessibility:colors.custom") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem v-if="accessibilityConfig.colors === 'custom'" button :detail="false">
					<Color v-model="accessibilityConfig.customColors.accentColor">
						<IonLabel>
							<h3>{{ $t("accessibility:accentColor.title") }}</h3>
						</IonLabel>
					</Color>
				</IonItem>

				<IonItem v-if="accessibilityConfig.colors === 'custom'" button :detail="false">
					<Color v-model="accessibilityConfig.customColors.backgroundColor">
						<IonLabel>
							<h3>{{ $t("accessibility:backgroundColor.title") }}</h3>
						</IonLabel>
					</Color>
				</IonItem>

				<IonItem>
					<IonRange
						v-model="accessibilityConfig.contrastLevel"
						:label="$t('accessibility:contrastLevel.title')"
						label-placement="stacked"
						:min="-1"
						:max="1"
						:step="0.05"
						:snaps="true"
						:ticks="false"
						:pin="true"
						:pin-formatter="(v) => `${Math.floor(v * 100)}%`"
					>
						<IonIcon slot="start" :icon="lowContrastMD" />
						<IonIcon slot="end" :icon="highContrastMD" />
					</IonRange>
				</IonItem>
			</IonList>
			
			<IonList>
				<IonItem button :detail="false">
					<IonIcon slot="start" :icon="fontMD" />
					<IonToggle v-model="accessibilityConfig.highLegibility">
						<IonLabel>
							<h3>{{ $t("accessibility:highLegibilityFont.title") }}</h3>
							<p>{{ $t("accessibility:highLegibilityFont.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem v-if="accessibilityConfig.highLegibility">
					<IonSelect
						v-model="accessibilityConfig.highLegibilityType"
						label-placement="floating"
						:label="$t('accessibility:highLegibilityFontType.title')"
						:cancel-text="$t('other:alerts.cancel')"
						interface="action-sheet"
					>
						<IonSelectOption value="atkinson" class="hl-atkinson">
							{{ $t("accessibility:highLegibilityFontType.atkinson") }}
						</IonSelectOption>

						<IonSelectOption value="opendyslexic" class="hl-opendyslexic">
							{{ $t("accessibility:highLegibilityFontType.opendyslexic") }}
						</IonSelectOption>

						<IonSelectOption value="lexend" class="hl-lexend">
							{{ $t("accessibility:highLegibilityFontType.lexend") }}
						</IonSelectOption>

						<IonSelectOption value="comicrelief" class="hl-comicrelief">
							{{ $t("accessibility:highLegibilityFontType.comicrelief") }}
						</IonSelectOption>

						<IonSelectOption value="system-font" class="hl-system-font">
							{{ $t("accessibility:highLegibilityFontType.system-font") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem>
					<IonRange
						v-model="accessibilityConfig.fontScale"
						:label="$t('accessibility:fontScale.title')"
						label-placement="stacked"
						:min="0.5"
						:max="1.5"
						:step="0.1"
						:snaps="true"
						:ticks="false"
						:pin="true"
						:pin-formatter="(v) => `${v}`"
					>
						<IonIcon slot="start" :icon="smallTextMD" />
						<IonIcon slot="end" :icon="bigTextMD" />
					</IonRange>
				</IonItem>
			</IonList>

			<IonList>
				<IonItem>
					<IonIcon slot="start" :icon="motionMD" />
					<IonToggle v-model="accessibilityConfig.reducedMotion">
						<IonLabel>
							<h3>{{ $t("accessibility:reducedMotion.title") }}</h3>
							<p>{{ $t("accessibility:reducedMotion.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonIcon v-if="accessibilityConfig.colorIndicatorPosition === 'avatar'" slot="start" :icon="colorsMD" />
					<IonIcon v-if="accessibilityConfig.colorIndicatorPosition === 'list-item'" slot="start" :icon="borderMD" />
					<IonSelect
						v-model="accessibilityConfig.colorIndicatorPosition"
						label-placement="floating"
						:label="$t('accessibility:colorIndicatorPosition.title')"
						:cancel-text="$t('other:alerts.cancel')"
						interface="action-sheet"
					>
						<IonSelectOption value="avatar">
							{{ $t("accessibility:colorIndicatorPosition.avatar") }}
						</IonSelectOption>
						<IonSelectOption value="list-item">
							{{ $t("accessibility:colorIndicatorPosition.listItem") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem>
					<IonIcon slot="start" :icon="compactMD" />
					<IonToggle v-model="accessibilityConfig.compactLists">
						<IonLabel> {{ $t("accessibility:compactLists.title") }} </IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonIcon slot="start" :icon="hideCoverMD" />
					<IonToggle v-model="accessibilityConfig.disableCovers">
						<IonLabel> {{ $t("accessibility:disableCovers.title") }} </IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonIcon slot="start" :icon="frontingNotificationMD" />
					<IonToggle v-model="accessibilityConfig.frontingNotification">
						<IonLabel> {{ $t("accessibility:frontingNotification.title") }} </IonLabel>
					</IonToggle>
				</IonItem>

				<!--
				We're not using this anymore since we deprecated member long pressing,
				however we do keep this here should we reintroduce long presses in some other areas
				<IonItem>
					<IonRange
						v-model="accessibilityConfig.longPressDuration"
						:label="$t('accessibility:longPressDuration.title')"
						label-placement="stacked"
						:min="500"
						:max="1000"
						:step="50"
						:snaps="true"
						:ticks="false"
						:pin="true"
						:pin-formatter="(v) => `${v / 1000}`"
					/>
				</IonItem>
				-->
			</IonList>
		</IonContent>
	</IonPage>
</template>

<style>
	button.action-sheet-button.hl-atkinson {
		font-family: 'Atkinson Hyperlegible', var(--ion-font-family);
	}
	
	button.action-sheet-button.hl-opendyslexic {
		font-family: 'OpenDyslexic', var(--ion-font-family);
	}
	
	button.action-sheet-button.hl-lexend {
		font-family: 'Lexend', var(--ion-font-family);
	}

	button.action-sheet-button.hl-comicrelief {
		font-family: 'Comic Relief', var(--ion-font-family);
	}
</style>
