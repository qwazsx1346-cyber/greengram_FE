<script setup>
import loadingImg from '@/assets/loading.gif';
import FeedCard from '@/components/FeedCard.vue';
import { reactive, watch } from 'vue';
import { useFeedStore } from '@/stores/feed';
import { getFeedList, deleteFeed } from '@/services/feedService';
import { useInfiniteScroll } from '@/composables/useInfiniteScroll';

const feedStore = useFeedStore();

const props = defineProps({
    ynDel: Boolean
});

useInfiniteScroll(window, () => {
    if(!state.isFinish) {
        getData(); // 바닥에 닿으면 실행할 함수
    }
});

const state = reactive({
    isLoading: false,
    isFinish: false
});

const getData = async () => {
    
    state.isLoading = true;
    const params = {
        page: feedStore.page,
        size: feedStore.rowPerPage
    }
    if(feedStore.profileUserId) {
        params.profile_user_id = feedStore.profileUserId
    }
    if(feedStore.keyword) {
        params.keyword = feedStore.keyword
    }
    
    try{
        const res = await getFeedList(params);
        if(res.status === 200) {
            feedStore.setPage(feedStore.page + 1);
            const result = res.data.resultData;
            if(result && result.length > 0) {
                feedStore.addFeedList(result);                        
            }
            if(result.length < feedStore.rowPerPage) {
                state.isFinish = true
            }        
        }
    } catch(e) {
        console.log('e: ', e);
    } finally {
        state.isLoading = false;
    }
}


//피드 삭제
const doDeleteFeed = async (feedId, idx) => {
    console.log('feedId:', feedId);
    console.log('idx:', idx);

    if(!confirm('삭제하시겠습니까?')) { return; }

    const params = { 'feed_id': feedId }

    const res = await deleteFeed(params);
    if(res.status === 200) {
        feedStore.deleteFeedByIdx(idx);
    }
}

watch(() => feedStore.reLoading, newVal => {
    console.log('newVal:', newVal)

    if(newVal === true) {        
        getData();
        feedStore.setReLoading(false);
    }
});
</script>

<template>    
    <feed-card v-for="(item, idx) in feedStore.feedList" :key="item.feedId" :item="item" :yn-del="props.ynDel" @on-delete-feed="doDeleteFeed(item.feedId, idx)" />
</template>

<style scoped>

</style>