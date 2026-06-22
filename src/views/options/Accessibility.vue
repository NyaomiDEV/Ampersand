<script setup lang="ts">
	import { IonContent, IonHeader, IonItem, IonRange, IonLabel, IonToggle, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSelect, IonSelectOption, IonIcon } from "@ionic/vue";
	import { accessibilityConfig, appConfig } from "../../lib/config";

	import lowContrastMD from "@material-symbols/svg-600/rounded/brightness_1.svg";
	import highContrastMD from "@material-symbols/svg-600/rounded/contrast.svg";
	import amoledMD from "@material-symbols/svg-600/rounded/night_sight_max.svg";
	import fontMD from "@material-symbols/svg-600/rounded/format_size.svg";
	import smallTextMD from "@material-symbols/svg-600/rounded/text_decrease.svg";
	import bigTextMD from "@material-symbols/svg-600/rounded/text_increase.svg";
	import colorsMD from "@material-symbols/svg-600/rounded/colors.svg";
	import borderMD from "@material-symbols/svg-600/rounded/border_color.svg";
	import compactMD from "@material-symbols/svg-600/rounded/list_alt.svg";
	import hideCoverMD from "@material-symbols/svg-600/rounded/hide_image.svg";
	import motionMD from "@material-symbols/svg-600/rounded/masked_transitions.svg";
	import frontingNotificationMD from "@material-symbols/svg-600/rounded/notifications_unread.svg";
	import tintMD from "@material-symbols/svg-600/rounded/colorize.svg";
	
	
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" default-href="/tab/options/" />
				<IonTitle>
					{{ $t("accessibility:header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			
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
						:ticks="true"
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
					<IonIcon slot="start" :icon="tintMD" />
					<IonSelect
						v-model="accessibilityConfig.tintWithColor"
						label-placement="floating"
						:label="$t('accessibility:tintWithColor.title')"
						:cancel-text="$t('other:alerts.cancel')"
						interface="action-sheet"
					>
						<IonSelectOption value="off">
							{{ $t("accessibility:tintWithColor.off") }}
						</IonSelectOption>

						<IonSelectOption value="accent">
							{{ $t("accessibility:tintWithColor.accent") }}
						</IonSelectOption>

						<IonSelectOption value="on">
							{{ $t("accessibility:tintWithColor.on") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem :disabled="appConfig.theme === 'light'">
					<IonIcon slot="start" :icon="amoledMD" />
					<IonToggle v-model="accessibilityConfig.themeIsAmoled">
						<IonLabel>
							<h3>{{ $t("accessibility:themeIsAmoled.title") }}</h3>
							<p>{{ $t("accessibility:themeIsAmoled.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonRange
						v-model="accessibilityConfig.contrastLevel"
						:label="$t('accessibility:contrastLevel.title')"
						label-placement="stacked"
						:min="-1"
						:max="1"
						:step="0.25"
						:snaps="true"
						:ticks="true"
						:pin="true"
						:pin-formatter="(v) => `${Math.floor(v * 100)}%`"
					>
						<IonIcon slot="start" :icon="lowContrastMD" />
						<IonIcon slot="end" :icon="highContrastMD" />
					</IonRange>
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
						:ticks="true"
						:pin="true"
						:pin-formatter="(v) => `${v / 1000}`"
					/>
				</IonItem>
				-->
			</IonList>

			<IonList>
				<IonItem>
					<IonIcon slot="start" :icon="frontingNotificationMD" />
					<IonToggle v-model="accessibilityConfig.frontingNotification">
						<IonLabel> {{ $t("accessibility:frontingNotification.title") }} </IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonIcon slot="start" :icon="hideCoverMD" />
					<IonToggle v-model="accessibilityConfig.disableCovers">
						<IonLabel> {{ $t("accessibility:disableCovers.title") }} </IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonIcon slot="start" :icon="compactMD" />
					<IonToggle v-model="accessibilityConfig.compactLists">
						<IonLabel> {{ $t("accessibility:compactLists.title") }} </IonLabel>
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
