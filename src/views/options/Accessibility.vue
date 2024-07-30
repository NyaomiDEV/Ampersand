<script setup lang="ts">
	import { IonContent, IonHeader, IonItem, IonIcon, IonRange, IonLabel, IonToggle, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment, IonSegmentButton} from '@ionic/vue';
	import { inject, reactive, watch } from 'vue';
	import { AccessibilityConfig } from '../../lib/config/types';
	import { getConfigEntry, saveConfig } from '../../lib/config';
	import { updateDarkMode } from '../../lib/mode';
	import Color from '../../components/Color.vue';
	import { updateMaterialColors } from '../../lib/theme';

	import CheckMD from '@material-design-icons/svg/outlined/check.svg';

	const config = reactive(getConfigEntry("accessibility") as AccessibilityConfig);
	watch(config, () => {
		saveConfig({
			accessibility: { ...config }
		});

		updateDarkMode();
		updateMaterialColors();

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
						<h3 class="centered-text">{{ $t("options:accessibility.uiVariant.title") }}</h3>
						<IonSegment class="segment-alt" value="ui-variant" v-model="config.theme">

							<IonSegmentButton value="auto" layout="icon-start">
								<IonIcon v-if="config.theme == 'auto'" :md="CheckMD" aria-hidden="true"/>
								<IonLabel>{{ $t("options:accessibility.uiVariant.auto") }}</IonLabel>
							</IonSegmentButton>

							<IonSegmentButton value="light" layout="icon-start">
								<IonIcon v-if="config.theme == 'light'" :md="CheckMD" aria-hidden="true"/>
								<IonLabel>{{ $t("options:accessibility.uiVariant.light") }}</IonLabel>
							</IonSegmentButton>

							<IonSegmentButton value="dark" layout="icon-start">
								<IonIcon v-if="config.theme == 'dark'" :md="CheckMD" aria-hidden="true"/>
								<IonLabel>{{ $t("options:accessibility.uiVariant.dark") }}</IonLabel>
							</IonSegmentButton>
						</IonSegment>
					</IonLabel>
				</IonItem>

				<IonItem button>
					<Color v-model="config.accentColor">
						<IonLabel>
							<h3>{{ $t("options:accessibility.accentColor.title") }}</h3>
							<p>{{ $t("options:accessibility.accentColor.desc") }}</p>
						</IonLabel>
					</Color>
				</IonItem>

				<IonItem>
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
							:label="config.fontScale.toString()"
							labelPlacement="stacked"
							:min="0.5"
							:max="1.5"
							:step="0.1"
							:snaps="true"
							:ticks="false"
						/>
					</IonLabel>
				</IonItem>

				<IonItem>
					<IonLabel class="more-padding">
						<h3 class="centered-text">{{ $t("options:accessibility.chatFontScale.title") }}</h3>
						<IonRange
							v-model="config.chatFontScale"
							:label="config.chatFontScale.toString()"
							labelPlacement="stacked"
							:min="0.5"
							:max="1.5"
							:step="0.1"
							:snaps="true"
							:ticks="false"
						/>
					</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
