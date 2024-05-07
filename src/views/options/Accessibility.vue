<script setup lang="ts">
	import { IonContent, IonHeader, IonItem, IonRange, IonLabel, IonToggle, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment, IonSegmentButton} from '@ionic/vue';
	import { inject, ref } from 'vue';
	import { AccessibilityConfig } from '../../lib/config/types';
	import { getConfigEntry } from '../../lib/config';

	const config = ref(getConfigEntry("accessibility") as AccessibilityConfig);

	console.log(config)

	const isIOS = inject<boolean>("isIOS");
</script>

<style>
ion-list ion-item:nth-child(2), ion-list ion-item:nth-child(5), ion-list ion-item:last-child {
	text-align: center;
}

ion-segment {
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
				<IonItem v-model="config.highLegibility">
					<IonToggle>
						<IonLabel>
							<h3>High legibility font</h3>
							<p>Use OpenDyslexic instead of the standard device font</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonLabel>
						<h3>UI variant</h3>
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

				<IonItem button v-model="config.accentColor" :detail="true">
					<IonLabel>
						<h3>Accent color</h3>
						<p>Use a custom accent color</p>
					</IonLabel>
				</IonItem>

				<IonItem v-model="config.reducedMotion">
					<IonToggle>
						<IonLabel>
							<h3>Reduced motion</h3>
							<p>Disable in-app animations</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem v-model="config.fontScale">
					<IonLabel>
						<h3>UI size</h3>
						<IonRange />
					</IonLabel>
				</IonItem>

				<IonItem v-model="config.chatFontScale">
					<IonLabel>
						<h3>Chat UI size</h3>
						<IonRange />
					</IonLabel>
				</IonItem>

			</IonList>
		</IonContent>
	</IonPage>
</template>
