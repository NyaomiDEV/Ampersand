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
		console.log(config);
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
					Accessibility
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">
				<IonItem>
					<IonToggle v-model="config.highLegibility">
						<IonLabel>
							<h3>High legibility font</h3>
							<p>Use OpenDyslexic instead of the standard device font</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonLabel>
						<h3 class="centered-text">UI variant</h3>
						<IonSegment value="ui-variant" v-model="config.theme">

							<IonSegmentButton value="auto" layout="icon-start">
								<IonIcon v-if="config.theme == 'auto'" :md="CheckMD" aria-hidden="true"/>
								<IonLabel>Auto</IonLabel>
							</IonSegmentButton>

							<IonSegmentButton value="light" layout="icon-start">
								<IonIcon v-if="config.theme == 'light'" :md="CheckMD" aria-hidden="true"/>
								<IonLabel>Light</IonLabel>
							</IonSegmentButton>

							<IonSegmentButton value="dark" layout="icon-start">
								<IonIcon v-if="config.theme == 'dark'" :md="CheckMD" aria-hidden="true"/>
								<IonLabel>Dark</IonLabel>
							</IonSegmentButton>
						</IonSegment>
					</IonLabel>
				</IonItem>

				<IonItem button>
					<Color v-model="config.accentColor">
						<IonLabel>
							<h3>Accent color</h3>
							<p>Use a custom accent color</p>
						</IonLabel>
					</Color>
				</IonItem>

				<IonItem>
					<IonToggle v-model="config.reducedMotion">
						<IonLabel>
							<h3>Reduced motion</h3>
							<p>Disable in-app animations</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonLabel>
						<h3 class="centered-text">UI size</h3>
						<IonRange
							v-model="config.fontScale"
							:label="config.fontScale.toString()"
							labelPlacement="end"
							:min="0.5"
							:max="1.5"
							:step="0.1"
							:snaps="true"
							:ticks="true"
						/>
					</IonLabel>
				</IonItem>

				<IonItem>
					<IonLabel>
						<h3 class="centered-text">Chat UI size</h3>
						<IonRange
							v-model="config.chatFontScale"
							:label="config.chatFontScale.toString()"
							labelPlacement="end"
							:min="0.5"
							:max="1.5"
							:step="0.1"
							:snaps="true"
							:ticks="true"
						/>
					</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
