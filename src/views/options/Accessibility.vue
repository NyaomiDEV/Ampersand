<script setup lang="ts">
	import { IonContent, IonHeader, IonItem, IonRange, IonLabel, IonToggle, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment, IonSelect, IonSelectOption } from "@ionic/vue";
	import { accessibilityConfig } from "../../lib/config";
	import Color from "../../components/Color.vue";

	import MD3SegmentButton from "../../components/MD3SegmentButton.vue";

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
						interface="popover"
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
					<IonLabel>
						<h3 class="centered-text">{{ $t("accessibility:uiVariant.title") }}</h3>
						<IonSegment v-model="accessibilityConfig.theme" class="segment-alt" value="ui-variant">

							<MD3SegmentButton value="auto">
								<IonLabel>{{ $t("accessibility:uiVariant.auto") }}</IonLabel>
							</MD3SegmentButton>

							<MD3SegmentButton value="light">
								<IonLabel>{{ $t("accessibility:uiVariant.light") }}</IonLabel>
							</MD3SegmentButton>

							<MD3SegmentButton value="dark">
								<IonLabel>{{ $t("accessibility:uiVariant.dark") }}</IonLabel>
							</MD3SegmentButton>
						</IonSegment>
					</IonLabel>
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

				<IonItem>
					<IonLabel class="more-padding">
						<h3 class="centered-text">{{ $t("accessibility:fontScale.title") }}</h3>
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
					</IonLabel>
				</IonItem>

				<IonItem>
					<IonLabel class="more-padding">
						<h3 class="centered-text">{{ $t("accessibility:longPressDuration.title") }}</h3>
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
					</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>

<style>
	ion-popover ion-item.hl-atkinson {
		font-family: 'Atkinson Hyperlegible', var(--ion-font-family);
	}
	
	ion-popover	ion-item.hl-opendyslexic {
		font-family: 'OpenDyslexic', var(--ion-font-family);
	}
	
	ion-popover	ion-item.hl-lexend {
		font-family: 'Lexend', var(--ion-font-family);
	}
</style>

<style scoped>
	ion-select::part(label) {
		max-width: unset;
	}
</style>