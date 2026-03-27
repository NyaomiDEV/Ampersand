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
		IonNote,
		IonItemDivider
	} from "@ionic/vue";
	import { newMember } from "../../lib/db/tables/members";
	import { appConfig } from "../../lib/config";
	import { newTag } from "../../lib/db/tables/tags";
	import { newSystem } from "../../lib/db/tables/system";
	import { escapeHatch, reverseEscapeHatch } from "../../lib/db/ioutils/dump";
	import { toast } from "../../lib/util/misc";
	import { useTranslation } from "i18next-vue";
	import { sep, documentDir } from "@tauri-apps/api/path";

	import memberMD from "@material-symbols/svg-600/outlined/account_circle-fill.svg";
	import systemMD from "@material-symbols/svg-600/outlined/supervised_user_circle.svg";
	import tagMD from "@material-symbols/svg-600/outlined/sell.svg";
	import importMD from "@material-symbols/svg-600/outlined/download.svg";
	import exportMD from "@material-symbols/svg-600/outlined/upload.svg";
	import { onMounted, ref } from "vue";
	import { exportDatabaseToJSON, importDatabaseFromJSON } from "../../lib/db/ioutils/json";
	import { getTables } from "../../lib/db/tables";
	import { exportArchive, importArchive } from "../../lib/db/ioutils/archive";
	
	const i18next = useTranslation();

	const escapeHatchPath = ref("");

	async function refreshAllData(){
		for(const table of Object.values(getTables())){
			if(!await table.refresh()){
				await toast(`Error at table ${table.name}`);
				return;
			}
		}
		await toast("Tables refreshed");
	}

	async function genMembers() {
		for(let i = 0; i < 100; i++){
			await newMember({
				system: appConfig.defaultSystem,
				name: `Member ${i}`,
				isPinned: false,
				isArchived: false,
				isCustomFront: false,
				tags: [],
				dateCreated: new Date()
			});
		}
	}

	async function genTags() {
		for(let i = 0; i < 100; i++){
			await newTag({
				name: `Tag ${i}`,
				type: "member",
				viewInLists: false
			});
		}
	}

	async function genSystems() {
		for(let i = 0; i < 100; i++){
			await newSystem({
				name: `System ${i}`,
				isPinned: false,
				isArchived: false
			});
		}
	}

	async function commitEscapeHatch(){
		try{
			await escapeHatch();
			await toast("ESCAPE HATCH ACTIVATED");
		}catch(_e){
			await toast(i18next.t("importExport:status.error"));
		}
	}

	async function commitReverseEscapeHatch(){
		try{
			await reverseEscapeHatch();
			await toast("REVERSE ESCAPE HATCH ACTIVATED");
		}catch(_e){
			await toast(i18next.t("importExport:status.error"));
		}
	}

	async function commitExportJSON(doYouHateYourDevice: boolean){
		try{
			const result = await exportDatabaseToJSON(doYouHateYourDevice).status;
			if(!result) throw new Error();
			await toast("JSON Exported");
		}catch(_e){
			await toast(i18next.t("importExport:status.error"));
		}
	}

	async function commitImportJSON(){
		try{
			const result = await importDatabaseFromJSON().status;
			if(!result) throw new Error();
			await toast("JSON Imported");
		}catch(_e){
			await toast(i18next.t("importExport:status.error"));
		}
	}

	async function commitExportArchive(){
		try{
			const result = await exportArchive().status;
			if(!result) throw new Error();
			await toast("Archive Exported");
		}catch(_e){
			await toast(i18next.t("importExport:status.error"));
		}
	}

	async function commitImportArchive(){
		try{
			const result = await importArchive().status;
			console.log(result);
			if(!result) throw new Error();
			await toast("Archive Imported");
		}catch(_e){
			await toast(i18next.t("importExport:status.error"));
		}
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
					default-href="/options/"
				/>
				<IonTitle>
					Testing Grounds
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonListHeader>Pay your respects here</IonListHeader>
			<IonList>
				<IonItem button>
					<IonLabel>Press F</IonLabel>
				</IonItem>
			</IonList>
			<IonNote>
				If you came here to search for something useful, sorry to disappoint you.
			</IonNote>

			<IonListHeader>Stress testing</IonListHeader>
			<IonList>
				<IonItem button detail @click="genMembers()">
					<IonIcon slot="start" :icon="memberMD" />
					<IonLabel>Make 100 members</IonLabel>
				</IonItem>
				<IonItem button detail @click="genSystems()">
					<IonIcon slot="start" :icon="systemMD" />
					<IonLabel>Make 100 systems</IonLabel>
				</IonItem>
				<IonItem button detail @click="genTags()">
					<IonIcon slot="start" :icon="tagMD" />
					<IonLabel>Make 100 tags</IonLabel>
				</IonItem>
			</IonList>

			<IonListHeader>Data consistency</IonListHeader>
			<IonList>
				<IonItem button detail @click="refreshAllData">
					<IonIcon slot="start" :icon="tagMD" />
					<IonLabel>Refresh the database</IonLabel>
				</IonItem>
			</IonList>

			<IonListHeader>Import / Export but we're desperate</IonListHeader>
			<IonList>
				<IonItemDivider>Experimental JSON support</IonItemDivider>
				<IonItem button :detail="true" @click="commitExportJSON(false)">
					<IonIcon slot="start" :icon="exportMD" />
					<IonLabel>
						<h3>Export JSON</h3>
					</IonLabel>
				</IonItem>
				<IonItem button :detail="true" @click="commitExportJSON(true)">
					<IonIcon slot="start" :icon="exportMD" />
					<IonLabel>
						<h3>Export JSON with images as Data URI</h3>
						<p>WARNING: Your device may crash!</p>
					</IonLabel>
				</IonItem>
				<IonItem button :detail="true" @click="commitImportJSON">
					<IonIcon slot="start" :icon="importMD" />
					<IonLabel>
						<h3>Import JSON</h3>
					</IonLabel>
				</IonItem>
				<IonItemDivider>Experimental Archive format</IonItemDivider>
				<IonItem button :detail="true" @click="commitExportArchive">
					<IonIcon slot="start" :icon="exportMD" />
					<IonLabel>
						<h3>Export Archive</h3>
					</IonLabel>
				</IonItem>
				<IonItem button :detail="true" @click="commitImportArchive">
					<IonIcon slot="start" :icon="importMD" />
					<IonLabel>
						<h3>Import Archive</h3>
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
