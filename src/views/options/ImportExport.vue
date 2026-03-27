<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonItem, IonIcon, IonLabel, IonPage, IonTitle, IonToolbar, IonBackButton, IonProgressBar, IonListHeader, IonNote } from "@ionic/vue";
	import { ref } from "vue";
	import { importDatabaseFromBinary } from "../../lib/db/ioutils/old";
	import { getDocumentFile, toast } from "../../lib/util/misc";
	import { useTranslation } from "i18next-vue";
	import { importPluralKit } from "../../lib/db/external/pluralkit";
	import { importTupperBox } from "../../lib/db/external/tupperbox";
	import { importSimplyPlural } from "../../lib/db/external/simplyplural";
	import { importOctocon } from "../../lib/db/external/octocon";

	import importMD from "@material-symbols/svg-600/outlined/download.svg";
	import exportMD from "@material-symbols/svg-600/outlined/upload.svg";
	import octoMD from "@material-symbols/svg-600/outlined/neurology.svg";
	import spMD from "@material-symbols/svg-600/outlined/spa.svg";
	import tupMD from "@material-symbols/svg-600/outlined/package_2.svg";
	import pkMD from "@material-symbols/svg-600/outlined/pet_supplies.svg";
	import { platform } from "@tauri-apps/plugin-os";
	import { exportArchive, importArchive } from "../../lib/db/ioutils/archive";

	const loading = ref(false);
	const barProgress = ref(-1);

	const i18next = useTranslation();

	async function exportDb(){
		loading.value = true;

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
			
		if(await status){
			await toast(
				platform() === "ios"
					? i18next.t("importExport:status.exportedAppIos")
					: i18next.t("importExport:status.exportedApp")
			);

		} else 
			await toast(i18next.t("importExport:status.errorExport"));

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
			await toast(i18next.t("importExport:status.error"));
		}
		loading.value = false;
	}

	// --- THIRD PARTY

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
			const file = await getDocumentFile(["json"], false);
			if (!file) throw new Error("no files specified");

			const ocExport = JSON.parse(new TextDecoder("utf-8").decode(file));
			const result = await importOctocon(ocExport);
			if(!result) throw new Error("errored out");

			await toast(i18next.t("importExport:status.importedOc"));
		}catch(_e){
			await toast(i18next.t("importExport:status.errorOc"));
		}
		loading.value = false;
	}

	async function importPk() {
		loading.value = true;
		try{
			const file = await getDocumentFile(["json"], false);
			if (!file) throw new Error("no files specified");

			const pkExport = JSON.parse(new TextDecoder("utf-8").decode(file));
			const result = await importPluralKit(pkExport);
			if(!result) throw new Error("errored out");

			await toast(i18next.t("importExport:status.importedPk"));
		}catch(_e){
			await toast(i18next.t("importExport:status.errorPk"));
		}
		loading.value = false;
	}

	async function importTu() {
		loading.value = true;
		try{
			const file = await getDocumentFile(["json"], false);
			if (!file) throw new Error("no files specified");

			const tuExport = JSON.parse(new TextDecoder("utf-8").decode(file));
			const result = await importTupperBox(tuExport);
			if(!result) throw new Error("errored out");

			await toast(i18next.t("importExport:status.importedTu"));
		}catch(_e) {
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
					default-href="/options/"
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
