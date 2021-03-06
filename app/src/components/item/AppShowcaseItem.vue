<template>
    <div :class="{'showcase': true, 'state-tabletmode': $store.state.app.isTabletMode && canSwitchMode, 'state-single': channels?.length == 1}">
        <div class="showcase-wrapper">
            <div class="showcase-container" :id="itemId">
                <div :class="{'showcase-item': true, 'state-active': $channel.isActive(channel.uuid)}" v-for="channel of channels" :key="channel.uuid" @click="select(channel.uuid)" :style="channel.colorHex ? 'border-color: ' + channel.colorHex +  ';' : ''">
                    <app-placeholder-image class="item-background" :resourceId="channel.uuid" :resourceType="'song'" :resourceKey="channel.info?.cover"></app-placeholder-image>

                    <div class="item-background-overlay"></div>
                    <div class="item-content">
                        <div class="item-title">
                            <app-wrappable-headline :accentColorHex="channel?.colorHex">
                                <template #subtitle>{{ channel?.description }}</template>
                                <template #title>{{ channel?.title }}</template>
                            </app-wrappable-headline>
                            <app-listener-counter :listeners="channel?.listeners"></app-listener-counter>
                        </div>

                        <div class="item-details">
                            <app-song-details :accentColorHex="channel.colorHex">
                                <template #sectionTitle>Gerade läuft</template>
                                <template #songTitle>{{ channel?.info?.title }}</template>
                                <template #songArtist>{{ channel?.info?.artist }}</template>
                            </app-song-details>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="item-divider" :style="activeChannelColor ? 'background-color: ' + activeChannelColor : ''"></div>

        <div class="grid-wrapper" v-if="channels.length > 0">
            <div class="grid-container">
                <transition-group name="anim_item_slide" mode="out-in" appear>
                    <app-grid-item v-for="channel of channels" :key="channel.uuid" :itemUuid="channel.uuid" :itemName="channel.title" :itemTitle="channel.info?.title" :itemSubtitle="channel.info?.artist" :itemListeners="channel.listeners" :itemColor="channel.colorHex" @selected="select(channel.uuid)"></app-grid-item>
                </transition-group>
            </div>
        </div>
    </div>
</template>

<script>
import clamp from 'clamp-js'

import AppPlaceholderImage from '@/components/image/AppPlaceholderImage.vue'
import AppGridItem from '@/components/item/AppGridItem.vue'
import AppSongDetails from '@/components/text/AppSongDetails.vue'
import AppListenerCounter from '@/components/text/AppListenerCounter.vue'
import AppWrappableHeadline from '@/components/text/AppWrappableHeadline.vue'

export default {
    components: {
        AppGridItem,
        AppSongDetails,
        AppListenerCounter,
        AppWrappableHeadline,
        AppPlaceholderImage
    },
    props: {
        channels: {
            type: Array,
            default: () => { return [] }
        },
        canSwitchMode: {
            type: Boolean,
            default: true
        }
    },
    emits: ['selected'],
    data() {
        return {
            itemId: this.generateId(6),
            observer: undefined
        }
    },
    computed: {
        activeChannelColor() {
            var channel = this.$store.state.activeChannel
            if(!channel) return undefined

            if(this.channels.filter((c) => c.uuid == channel.uuid).length) {
                // Channel is one of the showcased items
                return channel.colorHex
            }

            return undefined
        }
    },
    methods: {
        select(uuid) {
            if(!uuid) return
            this.$emit('selected', uuid)
        }
    },
    mounted() {
        setTimeout(() => {
            this.observer = new ResizeObserver(() => {
                if(this.$store.state.app.isTabletMode) return

                try {
                    for(const channel of this.channels) {
                        clamp(document.getElementById(channel.uuid+'description'), {clamp: 2, useNativeClamp: true, animate: true})
                        clamp(document.getElementById(channel.uuid+'title'), {clamp: 2, useNativeClamp: true, animate: true})
                    }
                } catch (error) { 
                    /* Do nothing */ 
                    this.observer = undefined
                }
            })
            this.observer.observe(document.getElementById(this.itemId))
        }, 500)
    }
}
</script>

<style lang="scss">
@import "@/assets/scss/items/showcaseItem.scss";
</style>