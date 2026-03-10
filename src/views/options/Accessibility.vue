<script setup lang="ts">
	import { IonContent, IonHeader, IonItem, IonRange, IonLabel, IonToggle, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSelect, IonSelectOption, IonIcon } from "@ionic/vue";
	import { accessibilityConfig } from "../../lib/config";
	import Color from "../../components/Color.vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import lowContrastMD from "@material-symbols/svg-600/outlined/brightness_1.svg";
	import highContrastMD from "@material-symbols/svg-600/outlined/contrast.svg";
	import amoledMD from "@material-symbols/svg-600/outlined/night_sight_max.svg";
	import vibrantMD from "@material-symbols/svg-600/outlined/brightness_7.svg";
	import fontMD from "@material-symbols/svg-600/outlined/format_size.svg";
	import smallTextMD from "@material-symbols/svg-600/outlined/text_decrease.svg";
	import bigTextMD from "@material-symbols/svg-600/outlined/text_increase.svg";
	import colorMD from "@material-symbols/svg-600/outlined/palette.svg";
	import hideCoverMD from "@material-symbols/svg-600/outlined/hide_image.svg";
	import motionMD from "@material-symbols/svg-600/outlined/masked_transitions.svg";
	import lightMD from "@material-symbols/svg-600/outlined/light_mode.svg";
	import darkMD from "@material-symbols/svg-600/outlined/dark_mode.svg";
	import autoMD from "@material-symbols/svg-600/outlined/routine.svg";
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" :icon="backMD" default-href="/options/" />
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
					<IonToggle v-model="accessibilityConfig.themeIsVibrant">
						<IonLabel>
							<h3>{{ $t("accessibility:themeIsVibrant.title") }}</h3>
							<p>{{ $t("accessibility:themeIsVibrant.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonIcon slot="start" :icon="colorMD" />
					<IonToggle v-model="accessibilityConfig.useAccentColor">
						<IonLabel>
							<h3>{{ $t("accessibility:useAccentColor.title") }}</h3>
							<p>{{ $t("accessibility:useAccentColor.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem v-if="accessibilityConfig.useAccentColor" button :detail="false">
					<Color v-model="accessibilityConfig.accentColor">
						<IonLabel>
							<h3>{{ $t("accessibility:accentColor.title") }}</h3>
						</IonLabel>
					</Color>
				</IonItem>

				<IonItem>
					<IonLabel position="floating">
						{{ $t("accessibility:contrastLevel.title") }}
					</IonLabel>
					<IonRange
						v-model="accessibilityConfig.contrastLevel"
						:min="0"
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

						<IonSelectOption value="system-font" class="hl-system-font">
							{{ $t("accessibility:highLegibilityFontType.system-font") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem>
					<IonLabel position="floating">
						{{ $t("accessibility:fontScale.title") }}
					</IonLabel>
					<IonRange
						v-model="accessibilityConfig.fontScale"
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
					<IonIcon slot="start" :icon="hideCoverMD" />
					<IonToggle v-model="accessibilityConfig.disableMemberCoversInList">
						<IonLabel>
							<h3>{{ $t("accessibility:disableMemberCoversInList.title") }}</h3>
							<p>{{ $t("accessibility:disableMemberCoversInList.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<!--
				We're not using this anymore since we deprecated member long pressing,
				however we do keep this here should we reintroduce long presses in some other areas
				<IonItem>
					<IonLabel position="floating">
						{{ $t("accessibility:longPressDuration.title") }}
					</IonLabel>
					<IonRange
						v-model="accessibilityConfig.longPressDuration"
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
	.action-sheet-button.hl-atkinson {
		font-family: 'Atkinson Hyperlegible', var(--ion-font-family);
	}
	
	.action-sheet-button.hl-opendyslexic {
		font-family: 'OpenDyslexic', var(--ion-font-family);
	}
	
	.action-sheet-button.hl-lexend {
		font-family: 'Lexend', var(--ion-font-family);
	}
</style>

<style scoped>
	.ui-variant {
		gap: 1em;
		display: flex;
		flex-direction: column;
	}
</style>