<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonItem, IonIcon, IonLabel, IonPage, IonTitle, IonToolbar, IonBackButton, IonProgressBar, IonListHeader, IonNote } from "@ionic/vue";
	import { h, ref } from "vue";
	import { importDatabaseFromBinary } from "../../lib/db/ioutils/old";
	import { getDocumentFile, promptOptions, sortName, toast } from "../../lib/util/misc";
	import { useTranslation } from "i18next-vue";
	import { importPluralKit } from "../../lib/db/external/importers/pluralkit.ts";
	import { importTupperBox } from "../../lib/db/external/importers/tupperbox.ts";
	import { importSimplyPlural } from "../../lib/db/external/importers_old/simplyplural.ts";
	import { importOctocon } from "../../lib/db/external/importers/octocon.ts";
	import { System } from "../../lib/db/entities";
	import { platform } from "@tauri-apps/plugin-os";
	import { exportArchive, importArchive } from "../../lib/db/ioutils/archive";
	import { exportDatabaseToJSON } from "../../lib/db/ioutils/json";
	import { exportReport } from "../../lib/db/ioutils/report";
	import { addModal, removeModal } from "../../lib/modals";
	import SystemSelect from "../../modals/SystemSelect.vue";

	import importMD from "@material-symbols/svg-600/rounded/download.svg";
	import exportMD from "@material-symbols/svg-600/rounded/upload.svg";
	import octoMD from "@material-symbols/svg-600/rounded/neurology.svg";
	import spMD from "@material-symbols/svg-600/rounded/spa.svg";
	import tupMD from "@material-symbols/svg-600/rounded/package_2.svg";
	import pkMD from "@material-symbols/svg-600/rounded/pet_supplies.svg";
	import jsonMD from "@material-symbols/svg-600/rounded/data_object.svg";

	const loading = ref(false);
	const barProgress = ref(-1);

	const i18next = useTranslation();

	async function showSystemSelect(): Promise<System[] | void> {
		return new Promise(resolve => {
			void (async () => {
				let _systems: System[] = [];
				const vnode = h(SystemSelect, {
					modelValue: _systems,
					"onUpdate:modelValue": (systems) => {
						_systems = systems;
					},
					onDidDismiss: (e) => {
						removeModal(vnode);
						if(e.detail.data !== "confirm"){
							resolve();
							return;
						}
						resolve(_systems.sort(sortName));
					}
				});

				const modal = await addModal(vnode);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
				await (modal.el as any).present();
			})();
		});
	}

	// --- EXPORT

	async function exportDb(){
		loading.value = true;
		try{
			const { progress, status } = exportArchive();

			progress.addEventListener("start", () => {
				barProgress.value = 0;
			});
			progress.addEventListener("progress", (evt) => {
				barProgress.value = (evt as CustomEvent).detail.progress;
			});
			progress.addEventListener("finish", () => {
				barProgress.value = -1;
			});
				
			if(!await status) throw new Error("errored out");

			await toast(
				platform() === "ios"
					? i18next.t("importExport:status.exportedAppIos")
					: i18next.t("importExport:status.exportedApp")
			);
		} catch(_e){
			console.error(_e);
			await toast(i18next.t("importExport:status.errorExport"));
		}
		loading.value = false;
	}

	async function exportRp(){
		loading.value = true;
		try{
			const systems = (await showSystemSelect())?.map(x => x.uuid);
			if(!systems) throw new Error("No systems selected");

			const values = await promptOptions(
				i18next.t("importExport:reportExport.includeHeader"),
				[
					{
						name: i18next.t("importExport:reportExport.includeArchived"),
						value: "archived"
					},
					{
						name: i18next.t("importExport:reportExport.includeCustomFronts"),
						value: "customFronts"
					}
				]
			);
			if(!values) throw new Error("No options selected");

			const { progress, status } = exportReport(systems, values.includes("archived"), values.includes("customFronts"));

			progress.addEventListener("start", () => {
				barProgress.value = 0;
			});
			progress.addEventListener("progress", (evt) => {
				barProgress.value = (evt as CustomEvent).detail.progress;
			});
			progress.addEventListener("finish", () => {
				barProgress.value = -1;
			});

			if(!await status) throw new Error("errored out");
			await toast(
				platform() === "ios"
					? i18next.t("importExport:status.exportedReportIos")
					: i18next.t("importExport:status.exportedReport")
			);
		}catch(_e){
			console.error(_e);
			await toast(i18next.t("importExport:status.errorExport"));
		}
		loading.value = false;
	}

	async function importDb(){
		loading.value = true;
		try{
			const { progress, status } = importArchive();

			progress.addEventListener("start", () => {
				barProgress.value = 0;
			});
			progress.addEventListener("progress", (evt) => {
				barProgress.value = (evt as CustomEvent).detail.progress;
			});
			progress.addEventListener("finish", () => {
				barProgress.value = -1;
			});

			if(!await status) throw new Error("errored out");

			await toast(i18next.t("importExport:status.imported"));
		}catch(_e){
			console.error(_e);
			await toast(i18next.t("importExport:status.error"));
		}
		loading.value = false;
	}

	// --- DEPRECATION ZONE


	async function importDbOld(){
		loading.value = true;
		try{
			const { progress, status } = importDatabaseFromBinary();

			progress.addEventListener("start", () => {
				barProgress.value = 0;
			});
			progress.addEventListener("progress", (evt) => {
				barProgress.value = (evt as CustomEvent).detail.progress;
			});
			progress.addEventListener("finish", () => {
				barProgress.value = -1;
			});

			if(!await status) throw new Error("errored out");

			await toast(i18next.t("importExport:status.imported"));
		}catch(_e){
			console.error(_e);
			await toast(i18next.t("importExport:status.error"));
		}
		loading.value = false;
	}

	// --- THIRD PARTY

	async function exportJson(){
		loading.value = true;
		try{
			const { progress, status } = exportDatabaseToJSON();

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
			await toast(
				platform() === "ios"
					? i18next.t("importExport:status.exportedJsonIos")
					: i18next.t("importExport:status.exportedJson")
			);
		}catch(_e){
			console.error(_e);
			await toast(i18next.t("importExport:status.errorExport"));
		}
		loading.value = false;
	}

	async function importSp() {
		loading.value = true;
		try{
			const file = await getDocumentFile(["json"], false);
			if (!file) throw new Error("no files specified");

			const spExport = JSON.parse(new TextDecoder("utf-8").decode(file));
			const result = await importSimplyPlural(spExport);
			if(!result) throw new Error("errored out");

			await toast(i18next.t("importExport:status.importedSp"));
		}catch(_e){
			console.error(_e);
			await toast(i18next.t("importExport:status.errorSp"));
		}
		loading.value = false;
	}

	async function importOc() {
		loading.value = true;
		try{
			const result = await importOctocon();
			if(!result) throw new Error("errored out");

			await toast(i18next.t("importExport:status.importedOc"));
		}catch(_e){
			console.error(_e);
			await toast(i18next.t("importExport:status.errorOc"));
		}
		loading.value = false;
	}

	async function importPk() {
		loading.value = true;
		try{
			const result = await importPluralKit();
			if(!result) throw new Error("errored out");

			await toast(i18next.t("importExport:status.importedPk"));
		}catch(_e){
			console.error(_e);
			await toast(i18next.t("importExport:status.errorPk"));
		}
		loading.value = false;
	}

	async function importTu() {
		loading.value = true;
		try{
			const result = await importTupperBox();
			if(!result) throw new Error("errored out");

			await toast(i18next.t("importExport:status.importedTu"));
		}catch(_e) {
			console.error(_e);
			await toast(i18next.t("importExport:status.errorTu"));
		}
		loading.value = false;
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					default-href="/tab/options/"
				/>
				<IonTitle>{{ $t("importExport:header") }}</IonTitle>
				<IonProgressBar v-if="loading" :type="barProgress < 0 ? 'indeterminate' : 'determinate'" :value="barProgress > 0 ? barProgress : 0" />
			</IonToolbar>
		</IonHeader>

		<IonContent>

			<IonListHeader>{{ $t("importExport:exportHeader") }}</IonListHeader>
			<IonList>

				<IonItem button :detail="true" @click="exportDb">
					<IonIcon slot="start" :icon="exportMD" />
					<IonLabel>
						<h3>{{ $t("importExport:dbExport.title") }}</h3>
						<p>{{ $t("importExport:dbExport.desc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem button :detail="true" @click="exportRp">
					<IonIcon slot="start" :icon="exportMD" />
					<IonLabel>
						<h3>{{ $t("importExport:reportExport.title") }}</h3>
						<p>{{ $t("importExport:reportExport.desc") }}</p>
					</IonLabel>
				</IonItem>

			</IonList>

			<IonListHeader>{{ $t("importExport:importHeader") }}</IonListHeader>
			<IonList>

				<IonItem button :detail="true" @click="importDb">
					<IonIcon slot="start" :icon="importMD" />
					<IonLabel>
						<h3>{{ $t("importExport:dbImport") }}</h3>
						<p>{{ $t("importExport:dbImportDesc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem button :detail="true" @click="importDbOld">
					<IonIcon slot="start" :icon="importMD" />
					<IonLabel>
						<h3>{{ $t("importExport:dbImportOld.title") }}</h3>
						<p>{{ $t("importExport:dbImportOld.desc") }}</p>
					</IonLabel>
				</IonItem>

			</IonList>
			<IonNote>{{ $t("importExport:dbImportOld.note") }}</IonNote>

			<IonListHeader>{{ $t("importExport:thirdPartyHeader") }}</IonListHeader>
			<IonList>

				<IonItem button :detail="true" @click="exportJson">
					<IonIcon slot="start" :icon="jsonMD" />
					<IonLabel>
						<h3>{{ $t("importExport:jsonExport.title") }}</h3>
						<p>{{ $t("importExport:jsonExport.desc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem button :detail="true" @click="importSp">
					<IonIcon slot="start" :icon="spMD" />
					<IonLabel>
						<h3>{{ $t("importExport:spImport") }}</h3>
						<p>{{ $t("importExport:dbImportDesc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem button :detail="true" @click="importOc">
					<IonIcon slot="start" :icon="octoMD" />
					<IonLabel>
						<h3>{{ $t("importExport:ocImport") }}</h3>
						<p>{{ $t("importExport:dbImportDesc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem button :detail="true" @click="importPk">
					<IonIcon slot="start" :icon="pkMD" />
					<IonLabel>
						<h3>{{ $t("importExport:pkImport") }}</h3>
						<p>{{ $t("importExport:dbImportDesc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem button :detail="true" @click="importTu">
					<IonIcon slot="start" :icon="tupMD" />
					<IonLabel>
						<h3>{{ $t("importExport:tuImport") }}</h3>
						<p>{{ $t("importExport:dbImportDesc") }}</p>
					</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
