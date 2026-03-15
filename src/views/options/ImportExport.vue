<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonItem, IonIcon, IonLabel, IonPage, IonTitle, IonToolbar, IonBackButton, IonProgressBar } from "@ionic/vue";
	import { ref } from "vue";
	import { importDatabaseFromBinary, exportDatabaseToBinary } from "../../lib/db/ioutils";
	import { getFiles, toast } from "../../lib/util/misc";
	import dayjs from "dayjs";
	import { save } from "@tauri-apps/plugin-dialog";
	import { mkdir, open } from "@tauri-apps/plugin-fs";
	import { useTranslation } from "i18next-vue";
	import { importPluralKit } from "../../lib/db/external/pluralkit";
	import { importTupperBox } from "../../lib/db/external/tupperbox";
	import { importSimplyPlural } from "../../lib/db/external/simplyplural";
	import { importOctocon } from "../../lib/db/external/octocon";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import importMD from "@material-symbols/svg-600/outlined/download.svg";
	import exportMD from "@material-symbols/svg-600/outlined/upload.svg";
	import octoMD from "@material-symbols/svg-600/outlined/neurology.svg";
	import spMD from "@material-symbols/svg-600/outlined/spa.svg";
	import tupMD from "@material-symbols/svg-600/outlined/package_2.svg";
	import pkMD from "@material-symbols/svg-600/outlined/pet_supplies.svg";

	import { documentDir, sep } from "@tauri-apps/api/path";
	import { platform } from "@tauri-apps/plugin-os";

	const loading = ref(false);
	const barProgress = ref(-1);

	const i18next = useTranslation();

	async function importDb(){
		loading.value = true;
		try{
			const files = await getFiles(undefined, false);
			if (!files.length) throw new Error("no files specified");

			const { progress, dbPromise } = importDatabaseFromBinary(new Uint8Array(await files[0].arrayBuffer()));

			progress.addEventListener("start", () => {
				barProgress.value = 0;
			});
			progress.addEventListener("progress", (evt) => {
				barProgress.value = (evt as CustomEvent).detail.progress;
			});
			progress.addEventListener("finish", () => {
				barProgress.value = -1;
			});

			const result = await dbPromise;

			if(!result) throw new Error("errored out");

			await toast(i18next.t("importExport:status.imported"));
		}catch(_e){
			await toast(i18next.t("importExport:status.error"));
		}
		loading.value = false;
	}

	async function importSp() {
		loading.value = true;
		try{
			const files = await getFiles(undefined, false);
			if (!files.length) throw new Error("no files specified");

			const spExport = JSON.parse(await files[0].text());
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
			const files = await getFiles(undefined, false);
			if (!files.length) throw new Error("no files specified");

			const ocExport = JSON.parse(await files[0].text());
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
			const files = await getFiles(undefined, false);
			if (!files.length) throw new Error("no files specified");

			const pkExport = JSON.parse(await files[0].text());
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
			const files = await getFiles(undefined, false);
			if (!files.length) throw new Error("no files specified");

			const tuExport = JSON.parse(await files[0].text());
			const result = await importTupperBox(tuExport);
			if(!result) throw new Error("errored out");

			await toast(i18next.t("importExport:status.importedTu"));
		}catch(_e) {
			await toast(i18next.t("importExport:status.errorTu"));
		}
		loading.value = false;
	}

	async function exportDb(){
		loading.value = true;

		const date = dayjs().format("YYYY-MM-DD");
		const fileName = `ampersand-backup-${date}.ampdb`;
		let path: string | undefined = `${await documentDir()}${sep()}${fileName}`;

		if(platform() !== "ios") {
			// Use save file dialog outside of iOS
			const _path = await save({
				defaultPath: path,
				filters: [{
					name: "Ampersand backups (.ampdb)",
					extensions: ["ampdb"]
				}]
			});
			if(_path) path = _path;
			else path = undefined; // save file got canceled
		}

		if(path){
			const { progress, dbPromise } = exportDatabaseToBinary();

			progress.addEventListener("start", () => {
				barProgress.value = 0;
			});
			progress.addEventListener("progress", (evt) => {
				barProgress.value = (evt as CustomEvent).detail.progress;
			});
			progress.addEventListener("finish", () => {
				barProgress.value = -1;
			});
			
			const dataStream = await dbPromise;

			if(dataStream){
				// Android uses content:// for providing scoped file paths; here we just get the FD from the returned URI
				if(!path.startsWith("content://")){
					// So in all other cases where the path is a real one, be it relative or not, we ensure we have a directory to write to
					const dirname = path
						.split(sep())
						.filter((_, i, a) => a.length - 1 !== i)
						.join(sep());
					await mkdir(
						dirname,
						{ recursive: true }
					);
				}

				const fd = await open(path, { write: true, create: true });
				let done = false;
				const reader = dataStream.getReader();
				do{
					const result = await reader.read();
					done = result.done;
					if(result.value) await fd.write(result.value);
				}while(!done);
				await fd.close();
				await toast(
					platform() === "ios"
						? i18next.t("importExport:status.exportedAppIos")
						: i18next.t("importExport:status.exportedApp")
				);
			}
		} else 
			await toast(i18next.t("importExport:status.errorExport"));

		loading.value = false;
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					:icon="backMD"
					default-href="/options/"
				/>
				<IonTitle>{{ $t("importExport:header") }}</IonTitle>
				<IonProgressBar v-if="loading" :type="barProgress < 0 ? 'indeterminate' : 'determinate'" :value="barProgress > 0 ? barProgress : 0" />
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList>

				<IonItem button :detail="true" @click="exportDb">
					<IonIcon slot="start" :icon="exportMD" />
					<IonLabel>
						<h3>{{ $t("importExport:dbExport.title") }}</h3>
						<p>{{ $t("importExport:dbExport.desc") }}</p>
					</IonLabel>
				</IonItem>

			</IonList>
			<IonList>

				<IonItem button :detail="true" @click="importDb">
					<IonIcon slot="start" :icon="importMD" />
					<IonLabel>
						<h3>{{ $t("importExport:dbImport") }}</h3>
						<p>{{ $t("importExport:dbImportDesc") }}</p>
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
