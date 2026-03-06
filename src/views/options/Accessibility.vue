<script setup lang="ts">
	import { IonContent, IonHeader, IonItem, IonRange, IonLabel, IonToggle, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment, IonSelect, IonSelectOption, IonSegmentButton } from "@ionic/vue";
	import { accessibilityConfig } from "../../lib/config";
	import Color from "../../components/Color.vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
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
					<div class="ui-variant">
						<IonLabel>
							{{ $t("accessibility:uiVariant.title") }}
						</IonLabel>
						<IonSegment v-model="accessibilityConfig.theme" value="ui-variant">
							<IonSegmentButton value="auto">
								<IonLabel>{{ $t("accessibility:uiVariant.auto") }}</IonLabel>
							</IonSegmentButton>
							<IonSegmentButton value="light">
								<IonLabel>{{ $t("accessibility:uiVariant.light") }}</IonLabel>
							</IonSegmentButton>
							<IonSegmentButton value="dark">
								<IonLabel>{{ $t("accessibility:uiVariant.dark") }}</IonLabel>
							</IonSegmentButton>
						</IonSegment>
					</div>
				</IonItem>

				<IonItem>
					<IonToggle v-model="accessibilityConfig.useAccentColor">
						<IonLabel>
							<h3>{{ $t("accessibility:useAccentColor.title") }}</h3>
							<p>{{ $t("accessibility:useAccentColor.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem button :detail="false" :disabled="!accessibilityConfig.useAccentColor">
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
					/>
				</IonItem>
			</IonList>
			
			<IonList>
				<IonItem button :detail="false">
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
					/>
				</IonItem>
			</IonList>

			<IonList>
				<IonItem>
					<IonToggle v-model="accessibilityConfig.reducedMotion">
						<IonLabel>
							<h3>{{ $t("accessibility:reducedMotion.title") }}</h3>
							<p>{{ $t("accessibility:reducedMotion.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
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