<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonList,
		IonPage,
		IonTitle,
		IonToolbar,
		IonBackButton,
		IonItem,
		IonIcon,
		IonLabel,
		IonListHeader,
		IonItemDivider,
		IonProgressBar
	} from "@ionic/vue";
	import { escapeHatch, reverseEscapeHatch } from "../../lib/db/ioutils/dump";
	import { languagePicker, toast } from "../../lib/util/misc";
	import { useTranslation } from "i18next-vue";
	import { sep, documentDir } from "@tauri-apps/api/path";

	import importMD from "@material-symbols/svg-600/rounded/download.svg";
	import exportMD from "@material-symbols/svg-600/rounded/upload.svg";
	import { onMounted, ref } from "vue";
	import { importDatabaseFromJSON } from "../../lib/db/ioutils/json";
	import { getTables, initMetrics } from "../../lib/db";
	import ConsoleLog from "../../components/ConsoleLog.vue";
	import { getLanguageDiff } from "../../lib/i18n";
	
	const i18next = useTranslation();

	const loading = ref(false);
	const barProgress = ref(-1);

	const escapeHatchPath = ref("");

	const lng = ref("en");

	async function refreshAllData(){
		loading.value = true;
		barProgress.value = 0;
		let progress = 0;

		const totalTables = Object.values(getTables()).length;
		let success = true;
		for(const table of Object.values(getTables())){
			try{
				await table.refresh();
				progress++;
				barProgress.value = progress / totalTables;
			}catch(e){
				await toast(`Error: ${(e as Error)}`);
				success = false;
			}
		}

		if(success)
			await toast("Tables refreshed");

		barProgress.value = -1;
		loading.value = false;
	}

	async function remigrate(){
		loading.value = true;
		barProgress.value = 0;
		let progress = 0;

		const totalTables = Object.values(getTables()).length;
		let success = true;
		for(const table of Object.values(getTables())){
			try{
				await table.migrate(0);
				progress++;
				barProgress.value = progress / totalTables;
			}catch(e){
				await toast(`Error: ${(e as Error)}`);
				success = false;
			}
		}

		if(success)
			await toast("Tables remigrated");

		barProgress.value = -1;
		loading.value = false;
	}

	async function commitEscapeHatch(){
		loading.value = true;
		try{
			await escapeHatch();
			await toast("ESCAPE HATCH ACTIVATED");
		}catch(_e){
			await toast(i18next.t("importExport:status.errorExport"));
		}
		loading.value = false;
	}

	async function commitReverseEscapeHatch(){
		loading.value = true;
		try{
			await reverseEscapeHatch();
			await toast("REVERSE ESCAPE HATCH ACTIVATED");
		}catch(_e){
			await toast(i18next.t("importExport:status.error"));
		}
		loading.value = false;
	}

	async function commitImportJSON(){
		loading.value = true;
		try{
			const { progress, status } = importDatabaseFromJSON();

			progress.addEventListener("start", () => {
				barProgress.value = 0;
			});
			progress.addEventListener("progress", (evt) => {
				barProgress.value = (evt as CustomEvent).detail.progress;
			});
			progress.addEventListener("finish", () => {
				barProgress.value = -1;
			});

			if(!await status) throw new Error();
			await toast("JSON Imported");
		}catch(_e){
			await toast(i18next.t("importExport:status.error"));
		}
		loading.value = false;
	}

	onMounted(async () => {
		escapeHatchPath.value = `${await documentDir() + sep()}`;
	});
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					default-href="/tab/options/"
				/>
				<IonTitle>
					Testing Grounds
				</IonTitle>
				<IonProgressBar v-if="loading" :type="barProgress < 0 ? 'indeterminate' : 'determinate'" :value="barProgress > 0 ? barProgress : 0" />
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonListHeader>Console output</IonListHeader>
			<IonList>
				<ConsoleLog />
			</IonList>

			<IonListHeader>Database initialization times</IonListHeader>
			<IonList>
				<IonItem>
					TOTAL (VIRTUAL)
					<span slot="end">{{ initMetrics.entries().reduce((p, c) => c[0] !== "_total" ? p + c[1] : p, 0) }}ms</span>
				</IonItem>
				<IonItem>
					TOTAL (ACTUALLY)
					<span slot="end">{{ initMetrics.get("_total") || 0 }}ms</span>
				</IonItem>
				<IonItem v-for="metric in [...initMetrics.entries().filter(x => x[0] !== '_total')].sort((a, b) => a[0].localeCompare(b[0]))" :key="metric[0]">
					{{ metric[0] }}
					<span slot="end">{{ metric[1] }}ms</span>
				</IonItem>
			</IonList>

			<IonListHeader>Translations galore</IonListHeader>
			<IonList>
				<IonItem button detail @click="languagePicker().then(res => { if(res) lng = res; })">
					<IonLabel>
						<h3>Pick a language</h3>
						<p>{{ $t("other:languageName.local", { lng }) }} ({{ $t("other:languageName.inEnglish", { lng }) }})</p>
					</IonLabel>
				</IonItem>
				<IonItem>
					<IonLabel>
						<h2>You miss those keys here</h2>
						<p v-for="key in getLanguageDiff(lng)" :key="key">
							{{ key }}
							<span style="float: right">{{ $t(key, { lng: "en" }) }}</span>
						</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonListHeader>Data consistency</IonListHeader>
			<IonList>
				<IonItem button detail @click="refreshAllData">
					<IonLabel>Refresh the database</IonLabel>
				</IonItem>
				<IonItem button detail @click="remigrate">
					<IonLabel>Remigrate tables</IonLabel>
				</IonItem>
			</IonList>

			<IonListHeader>Import / Export but we're desperate</IonListHeader>
			<IonList>
				<IonItem button :detail="true" @click="commitImportJSON">
					<IonIcon slot="start" :icon="importMD" />
					<IonLabel>
						<h3>Import JSON</h3>
					</IonLabel>
				</IonItem>
				<IonItemDivider>When everything else is failing</IonItemDivider>
				<IonItem button :detail="true" @click="commitEscapeHatch">
					<IonIcon slot="start" :icon="exportMD" />
					<IonLabel>
						<h3>Escape hatch</h3>
						<p>Path: {{ escapeHatchPath }}ampersand_escape_hatch_{date}{{ sep() }}</p>
					</IonLabel>
				</IonItem>
				<IonItem button :detail="true" @click="commitReverseEscapeHatch">
					<IonIcon slot="start" :icon="importMD" />
					<IonLabel>
						<h3>Reverse escape hatch</h3>
						<p>Path: {{ escapeHatchPath }}ampersand_illegitimate_intake{{ sep() }}</p>
					</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
