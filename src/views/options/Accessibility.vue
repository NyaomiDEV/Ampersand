<script setup lang="ts">
	import { IonContent, IonHeader, IonItem, IonRange, IonLabel, IonToggle, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment, IonSelect, IonSelectOption } from '@ionic/vue';
	import { inject } from 'vue';
	import { accessibilityConfig } from '../../lib/config';
	import Color from '../../components/Color.vue';

	import MD3SegmentButton from '../../components/MD3SegmentButton.vue';

	const isIOS = inject<boolean>("isIOS");
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("accessibility:header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">
				<IonItem>
					<IonToggle v-model="accessibilityConfig.highLegibility">
						<IonLabel>
							<h3>{{ $t("accessibility:highLegibilityFont.title") }}</h3>
							<p>{{ $t("accessibility:highLegibilityFont.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem>
					<IonSelect :label="$t('accessibility:highLegibilityFontType.title')" interface="popover" v-model="accessibilityConfig.highLegibilityType">
						<IonSelectOption value="atkinson">
							{{ $t("accessibility:highLegibilityFontType.atkinson") }}
						</IonSelectOption>

						<IonSelectOption value="opendyslexic">
							{{ $t("accessibility:highLegibilityFontType.opendyslexic") }}
						</IonSelectOption>

						<IonSelectOption value="lexend">
							{{ $t("accessibility:highLegibilityFontType.lexend") }}
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem>
					<IonLabel>
						<h3 class="centered-text">{{ $t("accessibility:uiVariant.title") }}</h3>
						<IonSegment class="segment-alt" value="ui-variant" v-model="accessibilityConfig.theme">

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

				<IonItem v-if="isIOS">
					<IonToggle v-model="accessibilityConfig.useMaterialTheming" @ion-change="e => { if(isIOS) accessibilityConfig.useAccentColor = e.detail.checked }">
						<IonLabel>
							<h3>{{ $t("accessibility:useMaterialTheming.title") }}</h3>
							<p>{{ $t("accessibility:useMaterialTheming.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem v-if="!isIOS">
					<IonToggle v-model="accessibilityConfig.useAccentColor">
						<IonLabel>
							<h3>{{ $t("accessibility:useAccentColor.title") }}</h3>
							<p>{{ $t("accessibility:useAccentColor.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem button detail="false" :disabled="!accessibilityConfig.useAccentColor && !accessibilityConfig.useMaterialTheming" v-if="accessibilityConfig.useMaterialTheming || !isIOS">
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
					<IonLabel class="more-padding">
						<h3 class="centered-text">{{ $t("accessibility:fontScale.title") }}</h3>
						<IonRange
							v-model="accessibilityConfig.fontScale"
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
						<h3 class="centered-text">{{ $t("accessibility:chatFontScale.title") }}</h3>
						<IonRange
							v-model="accessibilityConfig.chatFontScale"
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
						<h3 class="centered-text">{{ $t("accessibility:longPressDuration.title") }}</h3>
						<IonRange
							v-model="accessibilityConfig.longPressDuration"
							:min="500"
							:max="1000"
							:step="50"
							:snaps="true"
							:ticks="true"
							:pin="true"
							:pinFormatter="(v) => `${v / 1000}`"
						/>
					</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
