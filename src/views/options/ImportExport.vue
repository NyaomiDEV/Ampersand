<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonItem, IonLabel, IonPage, IonTitle, IonToolbar, IonBackButton, IonProgressBar, toastController } from "@ionic/vue";
	import { inject, ref } from "vue";
	import { importDatabaseFromBinary, exportDatabaseToBinary } from "../../lib/db/ioutils";
	import { getFiles } from "../../lib/util/misc";
	import dayjs from "dayjs";
	import { save } from "@tauri-apps/plugin-dialog";
	import { writeFile } from "@tauri-apps/plugin-fs";
	import { useTranslation } from "i18next-vue";
	import { importPluralKit } from "../../lib/db/external/pluralkit";
	import { importTupperBox } from "../../lib/db/external/tupperbox";
	import { importSimplyPlural } from "../../lib/db/external/simplyplural";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";

	const isIOS = inject<boolean>("isIOS");
	const loading = ref(false);

	const i18next = useTranslation();

	async function importDb(){
		loading.value = true;
		try{
			const files = await getFiles(undefined, false);
			if (!files.length) throw new Error("no files specified");

			const result = await importDatabaseFromBinary(new Uint8Array(await files[0].arrayBuffer()));
			if(!result) throw new Error("errored out");

			const statusMessage = await toastController.create({
				message: i18next.t("importExport:status.imported"),
				duration: 1500
			});
			await statusMessage.present();
		}catch(_e){
			const statusMessage = await toastController.create({
				message: i18next.t("importExport:status.error"),
				duration: 1500
			});
			await statusMessage.present();
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

			const statusMessage = await toastController.create({
				message: i18next.t("importExport:status.importedSp"),
				duration: 1500
			});
			await statusMessage.present();
		}catch(_e){
			const statusMessage = await toastController.create({
				message: i18next.t("importExport:status.errorSp"),
				duration: 1500
			});
			await statusMessage.present();
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

			const statusMessage = await toastController.create({
				message: i18next.t("importExport:status.importedPk"),
				duration: 1500
			});
			await statusMessage.present();
		}catch(_e){
			const statusMessage = await toastController.create({
				message: i18next.t("importExport:status.errorPk"),
				duration: 1500
			});
			await statusMessage.present();
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

			const statusMessage = await toastController.create({
				message: i18next.t("importExport:status.importedTu"),
				duration: 1500
			});
			await statusMessage.present();
		}catch(_e) {
			const statusMessage = await toastController.create({
				message: i18next.t("importExport:status.errorTu"),
				duration: 1500
			});
			await statusMessage.present();
		}
		loading.value = false;
	}

	async function exportDb(){
		loading.value = true;

		const data = await exportDatabaseToBinary();
		const date = dayjs().format("YYYY-MM-DD");

		const path = await save({
			filters: [{
				name: `ampersand-backup-${date}`,
				extensions: ["ampdb"]
			}]
		});

		if(path){
			await writeFile(path, data);
			const statusMessage = await toastController.create({
				message: i18next.t("importExport:status.exportedApp"),
				duration: 1500
			});

			await statusMessage.present();
		} else {
			const statusMessage = await toastController.create({
				message: i18next.t("importExport:status.errorExport"),
				duration: 1500
			});

			await statusMessage.present();
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
					:text="isIOS ? $t('other:back') : undefined"
					:icon="!isIOS ? backMD : undefined"
					default-href="/options/"
				/>
				<IonTitle>{{ $t("importExport:header") }}</IonTitle>
				<IonProgressBar v-if="loading" type="indeterminate" />
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList :inset="isIOS">

				<IonItem button :detail="true" @click="exportDb">
					<IonLabel>
						<h3>{{ $t("importExport:dbExport.title") }}</h3>
						<p>{{ $t("importExport:dbExport.desc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem button :detail="true" @click="importDb">
					<IonLabel>
						<h3>{{ $t("importExport:dbImport") }}</h3>
						<p>{{ $t("importExport:dbImportDesc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem button :detail="true" @click="importSp">
					<IonLabel>
						<h3>{{ $t("importExport:spImport") }}</h3>
						<p>{{ $t("importExport:dbImportDesc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem button :detail="true" @click="importPk">
					<IonLabel>
						<h3>{{ $t("importExport:pkImport") }}</h3>
						<p>{{ $t("importExport:dbImportDesc") }}</p>
					</IonLabel>
				</IonItem>

				<IonItem button :detail="true" @click="importTu">
					<IonLabel>
						<h3>{{ $t("importExport:tuImport") }}</h3>
						<p>{{ $t("importExport:dbImportDesc") }}</p>
					</IonLabel>
				</IonItem>
			</IonList>
		</IonContent>
	</IonPage>
</template>
