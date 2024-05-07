<script setup lang="ts">
	import { IonContent, IonHeader, IonItem, IonRange, IonLabel, IonToggle, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment, IonSegmentButton} from '@ionic/vue';
	import { inject, reactive, watch } from 'vue';
	import { AccessibilityConfig } from '../../lib/config/types';
	import { getConfigEntry, saveConfig } from '../../lib/config';
	import { updateDarkMode } from '../../lib/mode';

	const config = reactive(getConfigEntry("accessibility") as AccessibilityConfig);
	watch(config, () => {
		saveConfig({
			accessibility: { ...config }
		});

		updateDarkMode();
	});

	const isIOS = inject<boolean>("isIOS");
</script>

<style scoped>

	ion-segment, ion-range {
		margin-top: 8px;
	}

</style>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" />
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

							<IonSegmentButton value="auto">
								<IonLabel>Auto</IonLabel>
							</IonSegmentButton>

							<IonSegmentButton value="light">
								<IonLabel>Light</IonLabel>
							</IonSegmentButton>

							<IonSegmentButton value="dark">
								<IonLabel>Dark</IonLabel>
							</IonSegmentButton>
						</IonSegment>
					</IonLabel>
				</IonItem>

				<IonItem button :detail="true">
					<IonLabel>
						<h3>Accent color</h3>
						<p>Use a custom accent color</p>
					</IonLabel>
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
