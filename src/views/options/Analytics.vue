<script setup lang="ts">
	import { IonBackButton, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonPage, IonSegment, IonSegmentButton, IonSegmentContent, IonSegmentView, IonTitle, IonToolbar } from "@ionic/vue";
	import { getFrontingBetween, getFrontingStatistics } from "../../lib/db/tables/frontingEntries";
	import { h, onMounted, ref, shallowRef, useTemplateRef, watch } from "vue";
	import DatePopupPicker from "../../components/DatePopupPicker.vue";
	import { formatDate, formatWrittenTimeAbsolute, presencePhrase, sortName } from "../../lib/util/misc";
	import dayjs from "dayjs";
	import MemberItem from "../../components/member/MemberItem.vue";
	import { FrontingEntry, Member } from "../../lib/db/entities";
	import { getMember } from "../../lib/db/tables/members";
	import { addModal, removeModal } from "../../lib/modals";
	import { FrontingCo } from "../../lib/db/types";
	import { accessibilityConfig } from "../../lib/config";

	import AnalyticsDetail from "../../modals/AnalyticsDetail.vue";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import TheresNothingHere from "../../components/TheresNothingHere.vue";
	import PresenceRating from "../../components/PresenceRating.vue";

	import accountCircle from "@material-symbols/svg-600/rounded/account_circle-fill.svg";

	import totalMD from "@material-symbols/svg-600/rounded/all_inclusive.svg";
	import statsMD from "@material-symbols/svg-600/rounded/stacked_bar_chart.svg";
	import routineMD from "@material-symbols/svg-600/rounded/routine.svg";
	import minMD from "@material-symbols/svg-600/rounded/stat_minus_2.svg";
	import maxMD from "@material-symbols/svg-600/rounded/stat_2.svg";
	import averageMD from "@material-symbols/svg-600/rounded/avg_pace.svg";
	import morningMD from "@material-symbols/svg-600/rounded/wb_twilight.svg";
	import dayMD from "@material-symbols/svg-600/rounded/wb_sunny.svg";
	import eveningMD from "@material-symbols/svg-600/rounded/wb_twilight_2.svg";
	import nightMD from "@material-symbols/svg-600/rounded/moon_stars.svg";
	import presenceMD from "@material-symbols/svg-600/rounded/star_half.svg";
	import cofrontMD from "@material-symbols/svg-600/rounded/supervisor_account.svg";
	import AvatarStack from "../../components/AvatarStack.vue";

	const analytics = shallowRef<ReturnType<typeof getFrontingStatistics>>();
	const members = shallowRef<Member[]>();

	const startDate = ref(dayjs().subtract(1, "month").toDate());
	const endDate = ref(dayjs().toDate());

	const currentTab = ref("stats");

	const startDatePicker = useTemplateRef("startDatePicker");
	const endDatePicker = useTemplateRef("endDatePicker");

	async function getAnalytics(){
		const _analytics = getFrontingStatistics(
			(await getFrontingBetween(startDate.value, endDate.value))
				.filter(x => x.endTime) as (FrontingEntry & { endTime: Date; })[]
		);

		members.value = await Promise.all(Array.from(new Set([
			...Object.keys(_analytics).map(k => [...(_analytics[k] as Map<string, number>).keys()]),
		].flat())).map(x => getMember(x)));

		analytics.value = _analytics;
	}

	function flattenFrontingCo(analytics: ReturnType<typeof getFrontingStatistics>){
		if(!analytics || !members.value) return;

		const flattenedFrontingCo = new Map<string, FrontingCo>();

		for(const [member, cos] of analytics.frontingCo){
			for(const [withMember, co] of cos){

				const keys = [`${member}:${withMember}`, `${withMember}:${member}`];

				const existing = flattenedFrontingCo.entries().find(x => keys.includes(x[0]));
				if(!existing) 
					flattenedFrontingCo.set(keys[0], co);
			}
		}

		return new Map<Member[], FrontingCo>(flattenedFrontingCo.entries().map(x => [
			members.value!.filter(y => x[0].split(":").includes(y.uuid)).sort(sortName),
			x[1]]));
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

	function getStyle(members: Member[]){
		const style: Record<string, string> = {};

		if(members.length){
			const colors: string[] = members
				.filter(x => x.color)
				.map(x => x.color)
				.map((x, i, a) => {
					const percent = (i + 1) / a.length;
					return `${x as string} 0 ${percent * 100}%`;
				});

			if(!colors.length) return;

			style["--data-gradient"] = `linear-gradient(225deg, ${colors.join(",")})`;
		}

		return style;
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
						<IonIcon :icon="statsMD" aria-label="$t('analytics:stats')" />
					</IonSegmentButton>
					<IonSegmentButton value="daytime" content-id="daytime">
						<IonIcon :icon="routineMD" aria-label="$t('analytics:daytime')" />
					</IonSegmentButton>
					<IonSegmentButton value="presence" content-id="presence">
						<IonIcon :icon="presenceMD" aria-label="$t('analytics:presence')" />
					</IonSegmentButton>
					<IonSegmentButton value="cofront" content-id="cofront">
						<IonIcon :icon="cofrontMD" aria-label="$t('analytics:cofront')" />
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
								<template #before>
									<p class="right">{{ (analytics.frontingPercent.get(member.uuid) || 0).toFixed(2) }}%</p>
								</template>
								<p>
									{{ $t("analytics:frontingCount", { count: analytics.frontingCount.get(member.uuid) || 0 }) }}
								</p>
								<div class="with-icons">
									<span>
										<IonIcon :icon="totalMD" :aria-label="$t('analytics:total')" />
										{{ formatWrittenTimeAbsolute(analytics.frontingTotalSpan.get(member.uuid) || 0) }}
									</span>
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
								<template #before>
									<p class="right">{{ (analytics.influencingPercent.get(member.uuid) || 0).toFixed(2) }}%</p>
								</template>
								<p>
									{{ $t("analytics:influencingCount", { count: analytics.influencingCount.get(member.uuid) || 0 }) }}
								</p>
								<div class="with-icons">
									<span>
										<IonIcon :icon="totalMD" :aria-label="$t('analytics:total')" />
										{{ formatWrittenTimeAbsolute(analytics.influencingTotalSpan.get(member.uuid) || 0) }}
									</span>
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
								<template #before>
									<p class="right">{{ (analytics.influencedPercent.get(member.uuid) || 0).toFixed(2) }}%</p>
								</template>
								<p>
									{{ $t("analytics:influencedCount", { count: analytics.influencedCount.get(member.uuid) || 0 }) }}
								</p>
								<div class="with-icons">
									<span>
										<IonIcon :icon="totalMD" :aria-label="$t('analytics:total')" />
										{{ formatWrittenTimeAbsolute(analytics.influencedTotalSpan.get(member.uuid) || 0) }}
									</span>
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
										-
										{{ ((analytics.morningFronters.get(member.uuid) || 0) / (analytics.frontingCount.get(member.uuid) || 0) * 100).toFixed(2) }}%
									</span>
									<span v-if="analytics.dayFronters.get(member.uuid) || 0">
										<IonIcon :icon="dayMD" :aria-label="$t('analytics:day')" />
										{{ analytics.dayFronters.get(member.uuid) || 0 }}
										-
										{{ ((analytics.dayFronters.get(member.uuid) || 0) / (analytics.frontingCount.get(member.uuid) || 0) * 100).toFixed(2) }}%
									</span>

									<span v-if="analytics.eveningFronters.get(member.uuid) || 0">
										<IonIcon :icon="eveningMD" :aria-label="$t('analytics:evening')" />
										{{ analytics.eveningFronters.get(member.uuid) || 0 }}
										-
										{{ ((analytics.eveningFronters.get(member.uuid) || 0) / (analytics.frontingCount.get(member.uuid) || 0) * 100).toFixed(2) }}%
									</span>

									<span v-if="analytics.nightFronters.get(member.uuid) || 0">
										<IonIcon :icon="nightMD" :aria-label="$t('analytics:night')" />
										{{ analytics.nightFronters.get(member.uuid) || 0 }}
										-
										{{ ((analytics.nightFronters.get(member.uuid) || 0) / (analytics.frontingCount.get(member.uuid) || 0) * 100).toFixed(2) }}%
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
										-
										{{ ((analytics.morningInfluencers.get(member.uuid) || 0) / (analytics.influencingCount.get(member.uuid) || 0) * 100).toFixed(2) }}%
									</span>
									<span v-if="analytics.dayInfluencers.get(member.uuid) || 0">
										<IonIcon :icon="dayMD" :aria-label="$t('analytics:day')" />
										{{ analytics.dayInfluencers.get(member.uuid) || 0 }}
										-
										{{ ((analytics.dayInfluencers.get(member.uuid) || 0) / (analytics.influencingCount.get(member.uuid) || 0) * 100).toFixed(2) }}%
									</span>
									<span v-if="analytics.eveningInfluencers.get(member.uuid) || 0">
										<IonIcon :icon="eveningMD" :aria-label="$t('analytics:evening')" />
										{{ analytics.eveningInfluencers.get(member.uuid) || 0 }}
										-
										{{ ((analytics.eveningInfluencers.get(member.uuid) || 0) / (analytics.influencingCount.get(member.uuid) || 0) * 100).toFixed(2) }}%
									</span>
									<span v-if="analytics.nightInfluencers.get(member.uuid) || 0">
										<IonIcon :icon="nightMD" :aria-label="$t('analytics:night')" />
										{{ analytics.nightInfluencers.get(member.uuid) || 0 }}
										-
										{{ ((analytics.nightInfluencers.get(member.uuid) || 0) / (analytics.influencingCount.get(member.uuid) || 0) * 100).toFixed(2) }}%
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
										-
										{{ ((analytics.morningInfluenced.get(member.uuid) || 0) / (analytics.influencedCount.get(member.uuid) || 0) * 100).toFixed(2) }}%
									</span>
									<span v-if="analytics.dayInfluenced.get(member.uuid) || 0">
										<IonIcon :icon="dayMD" :aria-label="$t('analytics:day')" />
										{{ analytics.dayInfluenced.get(member.uuid) || 0 }}
										-
										{{ ((analytics.dayInfluenced.get(member.uuid) || 0) / (analytics.influencedCount.get(member.uuid) || 0) * 100).toFixed(2) }}%
									</span>
									<span v-if="analytics.eveningInfluenced.get(member.uuid) || 0">
										<IonIcon :icon="eveningMD" :aria-label="$t('analytics:evening')" />
										{{ analytics.eveningInfluenced.get(member.uuid) || 0 }}
										-
										{{ ((analytics.eveningInfluenced.get(member.uuid) || 0) / (analytics.influencedCount.get(member.uuid) || 0) * 100).toFixed(2) }}%
									</span>
									<span v-if="analytics.nightInfluenced.get(member.uuid) || 0">
										<IonIcon :icon="nightMD" :aria-label="$t('analytics:night')" />
										{{ analytics.nightInfluenced.get(member.uuid) || 0 }}
										-
										{{ ((analytics.nightInfluenced.get(member.uuid) || 0) / (analytics.influencedCount.get(member.uuid) || 0) * 100).toFixed(2) }}%
									</span>
								</div>
							</MemberItem>
						</template>
					</IonList>
				</IonSegmentContent>
				<IonSegmentContent id="presence">
					<TheresNothingHere v-if="!analytics.frontingPresenceMean.size && !analytics.influencingPresenceMean.size" />
					<IonList v-else>
						<template v-if="analytics.frontingPresenceMean.size">
							<IonListHeader>
								{{ $t("analytics:subheaders.fronting") }}
							</IonListHeader>
							<MemberItem
								v-for="member in Array.from(analytics.frontingPresenceMean.keys()).map(x => members?.find(y => y.uuid === x)).filter(x => !!x).sort((a, b) => {
									return (analytics?.frontingPresenceMean.get(b.uuid) || 0) - (analytics?.frontingPresenceMean.get(a.uuid) || 0)
								})"
								:key="member.uuid"
								button
								:member
								:show-role="false"
								:show-pronouns="false"
								:show-cover="false"
								@click="showModal(analytics.frontingEntries.get(member.uuid)?.filter(x => x.presence?.size) || [])"
							>
								<div class="presence-stars">
									<span>
										<h3>
											<IonIcon :icon="averageMD" :aria-label="$t('analytics:average')" />
											{{ presencePhrase(analytics.frontingPresenceMean.get(member.uuid) || 0) }}
										</h3>
										<p><PresenceRating :rating="analytics.frontingPresenceMean.get(member.uuid) || 0" /></p>
									</span>
									<span>
										<h3>
											<IonIcon :icon="minMD" :aria-label="$t('analytics:min')" />
											{{ presencePhrase(analytics.frontingPresenceMin.get(member.uuid) || 0) }}
										</h3>
										<p><PresenceRating :rating="analytics.frontingPresenceMin.get(member.uuid) || 0" /></p>
									</span>
									<span>
										<h3>
											<IonIcon :icon="maxMD" :aria-label="$t('analytics:max')" />
											{{ presencePhrase(analytics.frontingPresenceMax.get(member.uuid) || 0) }}
										</h3>
										<p><PresenceRating :rating="analytics.frontingPresenceMax.get(member.uuid) || 0" /></p>
									</span>
								</div>
							</MemberItem>
						</template>

						<template v-if="analytics.influencingPresenceMean.size">
							<IonListHeader>
								{{ $t("analytics:subheaders.influencing") }}
							</IonListHeader>
							<MemberItem
								v-for="member in Array.from(analytics.influencingPresenceMean.keys()).map(x => members?.find(y => y.uuid === x)).filter(x => !!x).sort((a, b) => {
									return (analytics?.influencingPresenceMean.get(b.uuid) || 0) - (analytics?.influencingPresenceMean.get(a.uuid) || 0)
								})"
								:key="member.uuid"
								button
								:member
								:show-role="false"
								:show-pronouns="false"
								:show-cover="false"
								@click="showModal(analytics.influencingEntries.get(member.uuid)?.filter(x => x.presence?.size) || [])"
							>
								<div class="presence-stars">
									<span>
										<h3>
											<IonIcon :icon="averageMD" :aria-label="$t('analytics:average')" />
											{{ presencePhrase(analytics.influencingPresenceMean.get(member.uuid) || 0) }}
										</h3>
										<p><PresenceRating :rating="analytics.influencingPresenceMean.get(member.uuid) || 0" /></p>
									</span>
									<span>
										<h3>
											<IonIcon :icon="minMD" :aria-label="$t('analytics:min')" />
											{{ presencePhrase(analytics.influencingPresenceMin.get(member.uuid) || 0) }}
										</h3>
										<p><PresenceRating :rating="analytics.influencingPresenceMin.get(member.uuid) || 0" /></p>
									</span>
									<span>
										<h3>
											<IonIcon :icon="maxMD" :aria-label="$t('analytics:max')" />
											{{ presencePhrase(analytics.influencingPresenceMax.get(member.uuid) || 0) }}
										</h3>
										<p><PresenceRating :rating="analytics.influencingPresenceMax.get(member.uuid) || 0" /></p>
									</span>
								</div>
							</MemberItem>
						</template>

					</IonList>
				</IonSegmentContent>
				<IonSegmentContent id="cofront">
					<TheresNothingHere v-if="!analytics.frontingCo.size" />
					<IonList v-else>
						<IonListHeader>
							{{ $t("analytics:subheaders.cofronting") }}
						</IonListHeader>
						<IonItem
							v-for="memberCouple in flattenFrontingCo(analytics)"
							:key="memberCouple[0].join(':')"
							button
							:class="{ 'with-border-color': accessibilityConfig.colorIndicatorPosition === 'list-item' }"
							:style="getStyle(memberCouple[0])"
							@click="showModal(memberCouple[1].entries)"
						>
							<AvatarStack
								slot="start"
								:avatars="memberCouple[0].map(member => ({
									image: member.image,
									clipShape: member.imageClip,
									color: member.color,
									icon: accountCircle
								}))"
							/>
							<IonLabel>

								<p class="right">{{ memberCouple[1].percent.toFixed(2) }}%</p>
								<h2>{{ memberCouple[0].map(x => x.name).join(" + ") }}</h2>
								<p>
									{{ $t("analytics:cofrontingCount", { count: memberCouple[1].count }) }}
								</p>
								<div class="with-icons">
									<span>
										<IonIcon :icon="totalMD" :aria-label="$t('analytics:total')" />
										{{ formatWrittenTimeAbsolute(memberCouple[1].totalSpan) }}
									</span>
									<span>
										<IonIcon :icon="averageMD" :aria-label="$t('analytics:average')" />
										{{ formatWrittenTimeAbsolute(memberCouple[1].totalSpan / memberCouple[1].count) }}
									</span>
									<span>
										<IonIcon :icon="minMD" :aria-label="$t('analytics:min')" />
										{{ formatWrittenTimeAbsolute(memberCouple[1].minSpan) }}
									</span>
									<span>
										<IonIcon :icon="maxMD" :aria-label="$t('analytics:max')" />
										{{ formatWrittenTimeAbsolute(memberCouple[1].maxSpan) }}
									</span>
								</div>
							</IonLabel>
						</IonItem>
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

	ion-item.with-border-color::part(native) {
		padding-inline-start: calc(4px + var(--padding-start) + var(--ion-safe-area-left, 0px));
	}

	ion-item.with-border-color::part(native)::before {
		content: "\A";
		display: block;
		position: absolute;
		top: 0;
		left: 0;
		background: var(--data-gradient);
		height: 100%;
		width: 4px;
	}

	:dir(rtl) ion-item.with-border-color::part(native)::before{
		right: 0;
		left: unset;
	}

	ion-label > p {
		text-wrap: wrap !important;
		overflow: visible !important;
	}

	p.right {
		margin-top: 2px;
		line-height: 26px;
		text-align: end;
		float: inline-end;
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
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.25em .5em;
		margin-top: 0.25em;
	}

	div.presence-stars {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 0em .5em;
	}
</style>