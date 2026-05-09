<script setup lang="ts">
	import { IonBackButton, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonPage, IonSegment, IonSegmentButton, IonSegmentContent, IonSegmentView, IonTitle, IonToolbar } from "@ionic/vue";
	import { getFrontingStatistics } from "../../lib/db/tables/frontingEntries";
	import { h, onMounted, ref, shallowRef, useTemplateRef, watch } from "vue";
	import DatePopupPicker from "../../components/DatePopupPicker.vue";
	import { formatDate, formatWrittenTimeAbsolute, presencePhrase } from "../../lib/util/misc";
	import dayjs from "dayjs";
	import MemberItem from "../../components/member/MemberItem.vue";
	import { FrontingEntry, Member } from "../../lib/db/entities";
	import { getMember } from "../../lib/db/tables/members";
	import { addModal, removeModal } from "../../lib/modals";

	import AnalyticsDetail from "../../modals/AnalyticsDetail.vue";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import TheresNothingHere from "../../components/TheresNothingHere.vue";
	import PresenceRating from "../../components/PresenceRating.vue";

	import statsMD from "@material-symbols/svg-600/outlined/stacked_bar_chart.svg";
	import routineMD from "@material-symbols/svg-600/outlined/routine.svg";
	import minMD from "@material-symbols/svg-600/outlined/stat_minus_2.svg";
	import maxMD from "@material-symbols/svg-600/outlined/stat_2.svg";
	import averageMD from "@material-symbols/svg-600/outlined/avg_pace.svg";
	import morningMD from "@material-symbols/svg-600/outlined/wb_twilight.svg";
	import dayMD from "@material-symbols/svg-600/outlined/wb_sunny.svg";
	import eveningMD from "@material-symbols/svg-600/outlined/wb_twilight_2.svg";
	import nightMD from "@material-symbols/svg-600/outlined/moon_stars.svg";
	import presenceMD from "@material-symbols/svg-600/rounded/star_half.svg";

	const analytics = shallowRef<Awaited<ReturnType<typeof getFrontingStatistics>>>();
	const members = shallowRef<Member[]>();

	const startDate = ref(new Date());
	const endDate = ref(new Date());

	const currentTab = ref("stats");

	const startDatePicker = useTemplateRef("startDatePicker");
	const endDatePicker = useTemplateRef("endDatePicker");

	async function getAnalytics(){
		const _analytics = await getFrontingStatistics(
			startDate.value,
			endDate.value
		);

		members.value = await Promise.all(Array.from(new Set([
			...Object.keys(_analytics).map(k => [...(_analytics[k] as Map<string, number>).keys()]),
		].flat())).map(x => getMember(x)));

		analytics.value = _analytics;
	}

	async function showModal(entries: FrontingEntry[]){
		const vnode = h(AnalyticsDetail, {
			entries,
			onDidDismiss: () => removeModal(vnode)
		});

		const modal = await addModal(vnode);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
		await (modal.el as any).present();
	}

	watch([startDate, endDate], async () => {
		await getAnalytics();
	});

	onMounted(async () => {
		await getAnalytics();
	});
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" default-href="/options/" />
				<IonTitle>{{ $t("analytics:header") }}</IonTitle>
			</IonToolbar>
			<IonToolbar v-if="analytics && members">
				<IonSegment v-model="currentTab">
					<IonSegmentButton value="stats" content-id="stats">
						<IonIcon :icon="statsMD" />
						<IonLabel>{{ $t("analytics:stats") }}</IonLabel>
					</IonSegmentButton>
					<IonSegmentButton value="daytime" content-id="daytime">
						<IonIcon :icon="routineMD" />
						<IonLabel>{{ $t("analytics:daytime") }}</IonLabel>
					</IonSegmentButton>
					<IonSegmentButton value="presence" content-id="presence">
						<IonIcon :icon="presenceMD" />
						<IonLabel>{{ $t("analytics:presence") }}</IonLabel>
					</IonSegmentButton>
				</IonSegment>
			</IonToolbar>
			<IonToolbar v-if="analytics && members">
				<div class="datePickers">
					<IonItem button detail @click="startDatePicker?.$el.present()">
						<IonLabel>
							<h3>{{ $t("analytics:startDate") }}</h3>
							<p>{{ formatDate(startDate, "only-collapsed") }}</p>
						</IonLabel>
					</IonItem>
					<IonItem button detail @click="endDatePicker?.$el.present()">
						<IonLabel>
							<h3>{{ $t("analytics:endDate") }}</h3>
							<p>{{ formatDate(endDate, "only-collapsed") }}</p>
						</IonLabel>
					</IonItem>
				</div>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="!analytics || !members" />
		<IonContent v-else>
			<IonSegmentView swipe-gesture>
				<IonSegmentContent id="stats">
					<TheresNothingHere v-if="!analytics.frontingCount.size && !analytics.influencingCount.size && !analytics.influencedCount.size" />
					<IonList v-else>
						<template v-if="analytics.frontingCount.size">
							<IonListHeader>
								{{ $t("analytics:subheaders.fronting") }}
							</IonListHeader>
							<MemberItem
								v-for="member in Array.from(analytics.frontingCount.keys()).map(x => members?.find(y => y.uuid === x)).filter(x => !!x).sort((a, b) => {
									return (analytics?.frontingCount.get(b.uuid) || 0) - (analytics?.frontingCount.get(a.uuid) || 0)
								})"
								:key="member.uuid"
								button
								:member
								:show-role="false"
								:show-pronouns="false"
								:show-cover="false"
								@click="showModal(analytics.frontingEntries.get(member.uuid) || [])"
							>
								<p>{{ $t("analytics:frontingCount", { count: analytics.frontingCount.get(member.uuid) || 0 }) }}</p>
								<p>
									{{ $t("analytics:total", { time: formatWrittenTimeAbsolute(analytics.frontingTotalSpan.get(member.uuid) || 0) }) }}
									- {{ (analytics.frontingPercent.get(member.uuid) || 0).toFixed(2) }}%
								</p>
								<div class="with-icons">
									<span>
										<IonIcon :icon="averageMD" :aria-label="$t('analytics:average')" />
										{{ formatWrittenTimeAbsolute(
											(analytics.frontingTotalSpan.get(member.uuid) || 0) /
												(analytics.frontingCount.get(member.uuid) || 0)
										) }}
									</span>
									<span>
										<IonIcon :icon="minMD" :aria-label="$t('analytics:min')" />
										{{ formatWrittenTimeAbsolute(analytics.frontingMinSpan.get(member.uuid) || 0) }}
									</span>
									<span>
										<IonIcon :icon="maxMD" :aria-label="$t('analytics:max')" />
										{{ formatWrittenTimeAbsolute(analytics.frontingMaxSpan.get(member.uuid) || 0) }}
									</span>
								</div>
							</MemberItem>
						</template>

						<template v-if="analytics.influencingCount.size">
							<IonListHeader>
								{{ $t("analytics:subheaders.influencing") }}
							</IonListHeader>
							<MemberItem
								v-for="member in Array.from(analytics.influencingCount.keys()).map(x => members?.find(y => y.uuid === x)).filter(x => !!x).sort((a, b) => {
									return (analytics?.influencingCount.get(b.uuid) || 0) - (analytics?.influencingCount.get(a.uuid) || 0)
								})"
								:key="member.uuid"
								button
								:member
								:show-role="false"
								:show-pronouns="false"
								:show-cover="false"
								@click="showModal(analytics.influencingEntries.get(member.uuid) || [])"
							>
								<p>{{ $t("analytics:influencingCount", { count: analytics.influencingCount.get(member.uuid) || 0 }) }}</p>
								<p>
									{{ $t("analytics:total", { time: formatWrittenTimeAbsolute(analytics.influencingTotalSpan.get(member.uuid) || 0) }) }}
									- {{ (analytics.influencingPercent.get(member.uuid) || 0).toFixed(2) }}%
								</p>
								<div class="with-icons">
									<span>
										<IonIcon :icon="averageMD" :aria-label="$t('analytics:average')" />
										{{ formatWrittenTimeAbsolute(
											(analytics.influencingTotalSpan.get(member.uuid) || 0) /
												(analytics.influencingCount.get(member.uuid) || 0)
										) }}
									</span>
									<span> 
										<IonIcon :icon="minMD" :aria-label="$t('analytics:min')" />
										{{ formatWrittenTimeAbsolute(analytics.influencingMinSpan.get(member.uuid) || 0) }}
									</span>
									<span>
										<IonIcon :icon="maxMD" :aria-label="$t('analytics:max')" />
										{{ formatWrittenTimeAbsolute(analytics.influencingMaxSpan.get(member.uuid) || 0) }}
									</span>
								</div>
							</MemberItem>
						</template>

						<template v-if="analytics.influencedCount.size">
							<IonListHeader>
								{{ $t("analytics:subheaders.influenced") }}
							</IonListHeader>
							<MemberItem
								v-for="member in Array.from(analytics.influencedCount.keys()).map(x => members?.find(y => y.uuid === x)).filter(x => !!x).sort((a, b) => {
									return (analytics?.influencedCount.get(b.uuid) || 0) - (analytics?.influencedCount.get(a.uuid) || 0)
								})"
								:key="member.uuid"
								button
								:member
								:show-role="false"
								:show-pronouns="false"
								:show-cover="false"
								@click="showModal(analytics.influencedEntries.get(member.uuid) || [])"
							>
								<p>{{ $t("analytics:influencedCount", { count: analytics.influencedCount.get(member.uuid) || 0 }) }}</p>
								<p>
									{{ $t("analytics:total", { time: formatWrittenTimeAbsolute(analytics.influencedTotalSpan.get(member.uuid) || 0) }) }}
									- {{ (analytics.influencedPercent.get(member.uuid) || 0).toFixed(2) }}%
								</p>
								<div class="with-icons">
									<span>
										<IonIcon :icon="averageMD" :aria-label="$t('analytics:average')" />
										{{ formatWrittenTimeAbsolute(
											(analytics.influencedTotalSpan.get(member.uuid) || 0) /
												(analytics.influencedCount.get(member.uuid) || 0)
										) }}
									</span>
									<span>
										<IonIcon :icon="minMD" :aria-label="$t('analytics:min')" />
										{{ formatWrittenTimeAbsolute(analytics.influencedMinSpan.get(member.uuid) || 0) }}
									</span>
									<span>
										<IonIcon :icon="maxMD" :aria-label="$t('analytics:max')" />
										{{ formatWrittenTimeAbsolute(analytics.influencedMaxSpan.get(member.uuid) || 0) }}
									</span>
								</div>
							</MemberItem>
						</template>
					</IonList>
				</IonSegmentContent>
				<IonSegmentContent id="daytime">
					<TheresNothingHere v-if="!analytics.frontingCount.size && !analytics.influencingCount.size && !analytics.influencedCount.size" />
					<IonList v-else>
						<template v-if="analytics.frontingCount.size">
							<IonListHeader>
								{{ $t("analytics:subheaders.fronting") }}
							</IonListHeader>
							<MemberItem
								v-for="member in Array.from(analytics.frontingCount.keys()).map(x => members?.find(y => y.uuid === x)).filter(x => !!x).sort((a, b) => {
									return (analytics?.frontingCount.get(b.uuid) || 0) - (analytics?.frontingCount.get(a.uuid) || 0)
								})"
								:key="member.uuid"
								button
								:member
								:show-role="false"
								:show-pronouns="false"
								:show-cover="false"
								@click="showModal(analytics.frontingEntries.get(member.uuid) || [])"
							>
								<div class="with-icons">
									<span v-if="analytics.morningFronters.get(member.uuid) || 0">
										<IonIcon :icon="morningMD" :aria-label="$t('analytics:morning')" />
										{{ analytics.morningFronters.get(member.uuid) || 0 }}
									</span>
									<span v-if="analytics.dayFronters.get(member.uuid) || 0">
										<IonIcon :icon="dayMD" :aria-label="$t('analytics:day')" />
										{{ analytics.dayFronters.get(member.uuid) || 0 }}
									</span>

									<span v-if="analytics.eveningFronters.get(member.uuid) || 0">
										<IonIcon :icon="eveningMD" :aria-label="$t('analytics:evening')" />
										{{ analytics.eveningFronters.get(member.uuid) || 0 }}
									</span>

									<span v-if="analytics.nightFronters.get(member.uuid) || 0">
										<IonIcon :icon="nightMD" :aria-label="$t('analytics:night')" />
										{{ analytics.nightFronters.get(member.uuid) || 0 }}
									</span>
								</div>
							</MemberItem>
						</template>

						<template v-if="analytics.influencingCount.size">
							<IonListHeader>
								{{ $t("analytics:subheaders.influencing") }}
							</IonListHeader>
							<MemberItem
								v-for="member in Array.from(analytics.influencingCount.keys()).map(x => members?.find(y => y.uuid === x)).filter(x => !!x).sort((a, b) => {
									return (analytics?.influencingCount.get(b.uuid) || 0) - (analytics?.influencingCount.get(a.uuid) || 0)
								})"
								:key="member.uuid"
								button
								:member
								:show-role="false"
								:show-pronouns="false"
								:show-cover="false"
								@click="showModal(analytics.influencingEntries.get(member.uuid) || [])"
							>
								<div class="with-icons">
									<span v-if="analytics.morningInfluencers.get(member.uuid) || 0">
										<IonIcon :icon="morningMD" :aria-label="$t('analytics:morning')" />
										{{ analytics.morningInfluencers.get(member.uuid) || 0 }}
									</span>
									<span v-if="analytics.dayInfluencers.get(member.uuid) || 0">
										<IonIcon :icon="dayMD" :aria-label="$t('analytics:day')" />
										{{ analytics.dayInfluencers.get(member.uuid) || 0 }}
									</span>
									<span v-if="analytics.eveningInfluencers.get(member.uuid) || 0">
										<IonIcon :icon="eveningMD" :aria-label="$t('analytics:evening')" />
										{{ analytics.eveningInfluencers.get(member.uuid) || 0 }}
									</span>
									<span v-if="analytics.nightInfluencers.get(member.uuid) || 0">
										<IonIcon :icon="nightMD" :aria-label="$t('analytics:night')" />
										{{ analytics.nightInfluencers.get(member.uuid) || 0 }}
									</span>
								</div>
							</MemberItem>
						</template>

						<template v-if="analytics.influencedCount.size">
							<IonListHeader>
								{{ $t("analytics:subheaders.influenced") }}
							</IonListHeader>
							<MemberItem
								v-for="member in Array.from(analytics.influencedCount.keys()).map(x => members?.find(y => y.uuid === x)).filter(x => !!x).sort((a, b) => {
									return (analytics?.influencedCount.get(b.uuid) || 0) - (analytics?.influencedCount.get(a.uuid) || 0)
								})"
								:key="member.uuid"
								button
								:member
								:show-role="false"
								:show-pronouns="false"
								:show-cover="false"
								@click="showModal(analytics.influencedEntries.get(member.uuid) || [])"
							>
								<div class="with-icons">
									<span v-if="analytics.morningInfluenced.get(member.uuid) || 0">
										<IonIcon :icon="morningMD" :aria-label="$t('analytics:morning')" />
										{{ analytics.morningInfluenced.get(member.uuid) || 0 }}
									</span>
									<span v-if="analytics.dayInfluenced.get(member.uuid) || 0">
										<IonIcon :icon="dayMD" :aria-label="$t('analytics:day')" />
										{{ analytics.dayInfluenced.get(member.uuid) || 0 }}
									</span>
									<span v-if="analytics.eveningInfluenced.get(member.uuid) || 0">
										<IonIcon :icon="eveningMD" :aria-label="$t('analytics:evening')" />
										{{ analytics.eveningInfluenced.get(member.uuid) || 0 }}
									</span>
									<span v-if="analytics.nightInfluenced.get(member.uuid) || 0">
										<IonIcon :icon="nightMD" :aria-label="$t('analytics:night')" />
										{{ analytics.nightInfluenced.get(member.uuid) || 0 }}
									</span>
								</div>
							</MemberItem>
						</template>
					</IonList>
				</IonSegmentContent>
				<IonSegmentContent id="presence">
					<TheresNothingHere v-if="!analytics.frontingCount.size && !analytics.influencingCount.size" />
					<IonList v-else>
						<template v-if="analytics.frontingCount.size">
							<IonListHeader>
								{{ $t("analytics:subheaders.fronting") }}
							</IonListHeader>
							<MemberItem
								v-for="member in Array.from(analytics.frontingCount.keys()).map(x => members?.find(y => y.uuid === x)).filter(x => !!x).sort((a, b) => {
									return (analytics?.frontingCount.get(b.uuid) || 0) - (analytics?.frontingCount.get(a.uuid) || 0)
								})"
								:key="member.uuid"
								button
								:member
								:show-role="false"
								:show-pronouns="false"
								:show-cover="false"
								@click="showModal(analytics.frontingEntries.get(member.uuid) || [])"
							>
								<h2>{{ presencePhrase(analytics.frontingPresenceMean.get(member.uuid) || 0) }}</h2>
								<p><PresenceRating :rating="analytics.frontingPresenceMean.get(member.uuid) || 0" /></p>
							</MemberItem>
						</template>

						<template v-if="analytics.influencingCount.size">
							<IonListHeader>
								{{ $t("analytics:subheaders.influencing") }}
							</IonListHeader>
							<MemberItem
								v-for="member in Array.from(analytics.influencingCount.keys()).map(x => members?.find(y => y.uuid === x)).filter(x => !!x).sort((a, b) => {
									return (analytics?.influencingCount.get(b.uuid) || 0) - (analytics?.influencingCount.get(a.uuid) || 0)
								})"
								:key="member.uuid"
								button
								:member
								:show-role="false"
								:show-pronouns="false"
								:show-cover="false"
								@click="showModal(analytics.influencingEntries.get(member.uuid) || [])"
							>
								<h2>{{ presencePhrase(analytics.influencingPresenceMean.get(member.uuid) || 0) }}</h2>
								<p><PresenceRating :rating="analytics.influencingPresenceMean.get(member.uuid) || 0" /></p>
							</MemberItem>
						</template>

					</IonList>
				</IonSegmentContent>
			</IonSegmentView>
		</IonContent>

		<DatePopupPicker
			ref="startDatePicker"
			:model-value="startDate"
			:title="$t('analytics:startDate')"
			presentation="date"
			show-default-buttons
			:max="endDate"
			@update:model-value="el => { startDate = dayjs(el).startOf('day').toDate() }"
		/>

		<DatePopupPicker
			ref="endDatePicker"
			:model-value="endDate"
			:title="$t('analytics:endDate')"
			presentation="date"
			show-default-buttons
			:min="startDate"
			:max="new Date()"
			@update:model-value="el => { endDate = dayjs(el).endOf('day').toDate() }"
		/>
	</IonPage>
</template>

<style scoped>
	ion-segment-content {
		overflow-y: auto;
	}

	ion-label > p {
		text-wrap: wrap !important;
		overflow: visible !important;
	}

	div.datePickers {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2px;
		border-radius: 16px;
		overflow: hidden;
		margin-bottom: 8px;

		> ion-item::part(native) {
			height: 100%;
		}
	}

	span ion-icon {
		vertical-align: middle;
	}

	div.with-icons {
		display: flex;
		flex-wrap: wrap;
		gap: 0px 0.5em;
	}

</style>