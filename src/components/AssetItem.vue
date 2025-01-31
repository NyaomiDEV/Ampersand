<script setup lang="ts">
    import { IonThumbnail, IonLabel, IonItem, IonIcon } from '@ionic/vue'
    import { Asset } from '../lib/db/entities';
    import { getObjectURL } from '../lib/util/blob';
    import { PartialBy } from '../lib/types';

	import {
		documentOutline as documentIOS
	} from "ionicons/icons";

	import documentMD from "@material-symbols/svg-600/outlined/draft.svg";
    import { openFile } from '../lib/native/opener';
    import { isTauri } from '../lib/mode';

    const props = defineProps<{
        asset: PartialBy<Asset, "uuid">,
        routeToEditPage?: boolean,
        routeToOpenFile?: boolean,
        showFilenameAndType?: boolean
    }>();

	function generatePreview(){
		if(props.asset.file.size){
			const file = props.asset.file;
			switch(file.type){
				case "image/png":
				case "image/jpeg":
				case "image/gif":
				case "image/webp":
					return getObjectURL(file);
				default:
					break;
			}
		}
		return;
	}

    function open(){
        if(!isTauri()){
            window.open(getObjectURL(props.asset.file), "_blank");
            return;
        }

        openFile(props.asset.file);
    }
</script>

<template>
    <IonItem
        button
        :routerLink="props.routeToEditPage ? '/options/assetManager/edit/?uuid=' + props.asset.uuid : undefined"
        @click="props.routeToOpenFile ? open() : undefined"
    >
        <IonThumbnail slot="start" v-if="generatePreview()">
            <img :src="getObjectURL(props.asset.file)" />
        </IonThumbnail>
		<IonIcon v-else slot="start" :ios="documentIOS" :md="documentMD" />
        <IonLabel class="nowrap">
            <template v-if="props.showFilenameAndType">
                <h2>{{ asset.file.name }}</h2>
				<p>{{ asset.file.type.split("/")[1].replace(/^x-/, '').toUpperCase() }}</p>
            </template>
            <template v-else>
                {{ props.asset.friendlyName }}
            </template>
        </IonLabel>
    </IonItem>
</template>

<style scoped>
    ion-thumbnail {
        width: 48px;
        height: 48px;
	    --border-radius: 16px;
    }

    ion-thumbnail img {
        object-fit: contain;
    }

	ion-icon {
		width: 48px;
		height: 48px;
	}
</style>