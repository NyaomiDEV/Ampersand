<script setup lang="ts">
	import { IonBackButton, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonPage, IonSegment, IonSegmentButton, IonSegmentContent, IonSegmentView, IonTitle, IonToolbar, useIonRouter } from "@ionic/vue";
	import { getFrontingStatistics } from "../../lib/db/tables/frontingEntries";
	import { onMounted, ref, shallowRef, useTemplateRef, watch } from "vue";
	import DatePopupPicker from "../../components/DatePopupPicker.vue";
	import { formatDate, formatWrittenTimeAbsolute } from "../../lib/util/misc";
	import dayjs from "dayjs";
	import MemberItem from "../../components/member/MemberItem.vue";
	import { Member } from "../../lib/db/entities";
	import { getMember } from "../../lib/db/tables/members";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import TheresNothingHere from "../../components/TheresNothingHere.vue";

	import statsMD from "@material-symbols/svg-600/outlined/bar_chart.svg";
	import routineMD from "@material-symbols/svg-600/outlined/routine.svg";
	import { maxUid, nilUid } from "../../lib/util/consts";

	const router = useIonRouter();

	const analytics = shallowRef<Awaited<ReturnType<typeof getFrontingStatistics>>>();
	const members = shallowRef<Member[]>();

	const startDate = ref(new Date());
	const endDate = ref(new Date());

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

	function clickMember(member: Member){
		if(member.uuid === nilUid || member.uuid === maxUid) return;

		router.push(`/members/edit?uuid=${member.uuid}`);
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
				<IonSegment value="stats">
					<IonSegmentButton value="stats" content-id="stats">
						<IonIcon :icon="statsMD" />
					</IonSegmentButton>
					<IonSegmentButton value="daytime" content-id="daytime">
						<IonIcon :icon="routineMD" />
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
								@click="clickMember(member)"
							>
								<p>{{ $t("analytics:frontingCount", { count: analytics.frontingCount.get(member.uuid) || 0 }) }}</p>
								<p>
									{{ $t("analytics:total", { time: formatWrittenTimeAbsolute(analytics.frontingTotalSpan.get(member.uuid) || 0) }) }}
									- {{ (analytics.frontingPercent.get(member.uuid) || 0).toFixed(2) }}%
								</p>
								<p>
									{{ $t("analytics:average", { time: formatWrittenTimeAbsolute(
										(analytics.frontingTotalSpan.get(member.uuid) || 0) /
											(analytics.frontingCount.get(member.uuid) || 0)
									) }) }}
								</p>
								<p>
									{{ $t("analytics:min", { time: formatWrittenTimeAbsolute(analytics.frontingMinSpan.get(member.uuid) || 0) }) }}
								</p>
								<p>
									{{ $t("analytics:max", { time: formatWrittenTimeAbsolute(analytics.frontingMaxSpan.get(member.uuid) || 0) }) }}
								</p>
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
								@click="clickMember(member)"
							>
								<p>{{ $t("analytics:influencingCount", { count: analytics.influencingCount.get(member.uuid) || 0 }) }}</p>
								<p>
									{{ $t("analytics:total", { time: formatWrittenTimeAbsolute(analytics.influencingTotalSpan.get(member.uuid) || 0) }) }}
									- {{ (analytics.influencingPercent.get(member.uuid) || 0).toFixed(2) }}%
								</p>
								<p>
									{{ $t("analytics:average", { time: formatWrittenTimeAbsolute(
										(analytics.influencingTotalSpan.get(member.uuid) || 0) /
											(analytics.influencingCount.get(member.uuid) || 0)
									) }) }}
								</p>
								<p>
									{{ $t("analytics:min", { time: formatWrittenTimeAbsolute(analytics.influencingMinSpan.get(member.uuid) || 0) }) }}
								</p>
								<p>
									{{ $t("analytics:max", { time: formatWrittenTimeAbsolute(analytics.influencingMaxSpan.get(member.uuid) || 0) }) }}
								</p>
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
								@click="clickMember(member)"
							>
								<p>{{ $t("analytics:influencedCount", { count: analytics.influencedCount.get(member.uuid) || 0 }) }}</p>
								<p>
									{{ $t("analytics:total", { time: formatWrittenTimeAbsolute(analytics.influencedTotalSpan.get(member.uuid) || 0) }) }}
									- {{ (analytics.influencedPercent.get(member.uuid) || 0).toFixed(2) }}%
								</p>
								<p>
									{{ $t("analytics:average", { time: formatWrittenTimeAbsolute(
										(analytics.influencedTotalSpan.get(member.uuid) || 0) /
											(analytics.influencedCount.get(member.uuid) || 0)
									) }) }}
								</p>
								<p>
									{{ $t("analytics:min", { time: formatWrittenTimeAbsolute(analytics.influencedMinSpan.get(member.uuid) || 0) }) }}
								</p>
								<p>
									{{ $t("analytics:max", { time: formatWrittenTimeAbsolute(analytics.influencedMaxSpan.get(member.uuid) || 0) }) }}
								</p>
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
								@click="clickMember(member)"
							>
								<p v-if="analytics.nightFronters.get(member.uuid) || 0">{{ $t("analytics:night", { count: analytics.nightFronters.get(member.uuid) || 0 }) }}</p>
								<p v-if="analytics.morningFronters.get(member.uuid) || 0">{{ $t("analytics:morning", { count: analytics.morningFronters.get(member.uuid) || 0 }) }}</p>
								<p v-if="analytics.dayFronters.get(member.uuid) || 0">{{ $t("analytics:day", { count: analytics.dayFronters.get(member.uuid) || 0 }) }}</p>
								<p v-if="analytics.eveningFronters.get(member.uuid) || 0">{{ $t("analytics:evening", { count: analytics.eveningFronters.get(member.uuid) || 0 }) }}</p>
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
								@click="clickMember(member)"
							>
								<p v-if="analytics.nightInfluencers.get(member.uuid) || 0">{{ $t("analytics:night", { count: analytics.nightInfluencers.get(member.uuid) || 0 }) }}</p>
								<p v-if="analytics.morningInfluencers.get(member.uuid) || 0">{{ $t("analytics:morning", { count: analytics.morningInfluencers.get(member.uuid) || 0 }) }}</p>
								<p v-if="analytics.dayInfluencers.get(member.uuid) || 0">{{ $t("analytics:day", { count: analytics.dayInfluencers.get(member.uuid) || 0 }) }}</p>
								<p v-if="analytics.eveningInfluencers.get(member.uuid) || 0">{{ $t("analytics:evening", { count: analytics.eveningInfluencers.get(member.uuid) || 0 }) }}</p>
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
								@click="clickMember(member)"
							>
								<p v-if="analytics.nightInfluenced.get(member.uuid) || 0">{{ $t("analytics:night", { count: analytics.nightInfluenced.get(member.uuid) || 0 }) }}</p>
								<p v-if="analytics.morningInfluenced.get(member.uuid) || 0">{{ $t("analytics:morning", { count: analytics.morningInfluenced.get(member.uuid) || 0 }) }}</p>
								<p v-if="analytics.dayInfluenced.get(member.uuid) || 0">{{ $t("analytics:day", { count: analytics.dayInfluenced.get(member.uuid) || 0 }) }}</p>
								<p v-if="analytics.eveningInfluenced.get(member.uuid) || 0">{{ $t("analytics:evening", { count: analytics.eveningInfluenced.get(member.uuid) || 0 }) }}</p>
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
</style>