<script setup lang="ts">
	import { IonContent, IonHeader, IonItem, IonRange, IonLabel, IonToggle, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment } from '@ionic/vue';
	import { inject, reactive, watch } from 'vue';
	import { AccessibilityConfig } from '../../lib/config/types';
	import { getConfigEntry, saveConfig } from '../../lib/config';
	import { updateAccessibility, updateDarkMode } from '../../lib/mode';
	import Color from '../../components/Color.vue';
	import { updateMaterialColors } from '../../lib/theme';

	import MD3SegmentButton from '../../components/MD3SegmentButton.vue';

	const config = reactive(getConfigEntry("accessibility") as AccessibilityConfig);
	watch(config, () => {
		saveConfig({
			accessibility: { ...config }
		});

		updateDarkMode();
		updateMaterialColors();
		updateAccessibility();
	});

	const isIOS = inject<boolean>("isIOS");
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:accessibility.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">
				<IonItem>
					<IonToggle v-model="config.highLegibility">
						<IonLabel>
							<h3>{{ $t("options:accessibility.highLegibilityFont.title") }}</h3>
							<p>{{ $t("options:accessibility.highLegibilityFont.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonLabel>
						<h3 class="centered-text">{{ $t("options:accessibility.highLegibilityFontType.title") }}</h3>
						<IonSegment class="segment-alt" value="high-legibility-type" v-model="config.highLegibilityType">

							<MD3SegmentButton value="atkinson">
								<IonLabel>{{ $t("options:accessibility.highLegibilityFontType.atkinson") }}</IonLabel>
							</MD3SegmentButton>

							<MD3SegmentButton value="opendyslexic">
								<IonLabel>{{ $t("options:accessibility.highLegibilityFontType.opendyslexic") }}</IonLabel>
							</MD3SegmentButton>
						</IonSegment>
					</IonLabel>
				</IonItem>

				<IonItem>
					<IonLabel>
						<h3 class="centered-text">{{ $t("options:accessibility.uiVariant.title") }}</h3>
						<IonSegment class="segment-alt" value="ui-variant" v-model="config.theme">

							<MD3SegmentButton value="auto">
								<IonLabel>{{ $t("options:accessibility.uiVariant.auto") }}</IonLabel>
							</MD3SegmentButton>

							<MD3SegmentButton value="light">
								<IonLabel>{{ $t("options:accessibility.uiVariant.light") }}</IonLabel>
							</MD3SegmentButton>

							<MD3SegmentButton value="dark">
								<IonLabel>{{ $t("options:accessibility.uiVariant.dark") }}</IonLabel>
							</MD3SegmentButton>
						</IonSegment>
					</IonLabel>
				</IonItem>

				<IonItem>
					<IonToggle v-model="config.useAccentColor">
						<IonLabel>
							<h3>{{ $t("options:accessibility.useAccentColor.title") }}</h3>
							<p>{{ $t("options:accessibility.useAccentColor.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem button>
					<Color v-model="config.accentColor">
						<IonLabel>
							<h3>{{ $t("options:accessibility.accentColor.title") }}</h3>
							<p>{{ $t("options:accessibility.accentColor.desc") }}</p>
						</IonLabel>
					</Color>
				</IonItem>

				<IonItem v-if="false"> <!-- we don't have anything that warrants us reduced motion yet -->
					<IonToggle v-model="config.reducedMotion">
						<IonLabel>
							<h3>{{ $t("options:accessibility.reducedMotion.title") }}</h3>
							<p>{{ $t("options:accessibility.reducedMotion.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonLabel class="more-padding">
						<h3 class="centered-text">{{ $t("options:accessibility.fontScale.title") }}</h3>
						<IonRange
							v-model="config.fontScale"
							:min="0.5"
							:max="1.5"
							:step="0.1"
							:snaps="true"
							:ticks="true"
							:pin="true"
							:pinFormatter="(v) => `${v}`"
						/>
					</IonLabel>
				</IonItem>

				<IonItem>
					<IonLabel class="more-padding">
						<h3 class="centered-text">{{ $t("options:accessibility.chatFontScale.title") }}</h3>
						<IonRange
							v-model="config.chatFontScale"
							:min="0.5"
							:max="1.5"
							:step="0.1"
							:snaps="true"
							:ticks="true"
							:pin="true"
							:pinFormatter="(v) => `${v}`"
						/>
					</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
