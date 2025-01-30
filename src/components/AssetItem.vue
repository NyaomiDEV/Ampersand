<script setup lang="ts">
    import { IonThumbnail, IonLabel, IonItem } from '@ionic/vue'
    import { Asset } from '../lib/db/entities';
    import { getBlobURL } from '../lib/util/blob';

    const props = defineProps<{
        asset: Asset
    }>();
</script>

<template>
    <IonItem button :routerLink="'/options/assetManager/edit/?uuid=' + props.asset.uuid">
        <IonThumbnail slot="start">
            <img :src="getBlobURL(props.asset.file)" />
        </IonThumbnail>
        <IonLabel class="nowrap">{{ props.asset.friendlyName }}</IonLabel>
    </IonItem>
</template>

<style scoped>
    ion-thumbnail {
	    --border-radius: 16px;
    }
</style>