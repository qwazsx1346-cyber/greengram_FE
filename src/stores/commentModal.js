import { reactive } from 'vue';
import { defineStore } from 'pinia';
import { postComment, getCommentList, deleteComment } from '@/services/feedCommentService';
import { useAuthenticationStore } from '@/stores/authentication';

export const useCommentModalStore = defineStore(
    "commentModal",
    () => {
        const state = reactive({
            showModal: false,
            commentList: [],
            feedId: 0,
            page: 1,
            size: 20,
            isLoading: false,
            isFinish: false,
            comment: ''
        });

        const close = () => {
            console.log('close!!!');
            state.showModal = false;
            state.isFinish = false;
            state.commentList = [];
            state.feedId = 0;
            state.page = 1;
        }

        const setFeedId = feedId => {
            close();
            state.showModal = true;
            state.feedId = feedId;
            doGetCommentList();
        }

        const doPostComment = async () => {
            const authenticationStore = useAuthenticationStore();

            if (state.comment.trim().length === 0) {
                alert('댓글 내용을 작성해 주세요.');
                return;
            }

            const data = {
                feedId: state.feedId,
                comment: state.comment,
            };

            const res = await postComment(data);
            if (res.status === 200) {
                const result = res.data.resultData;

                const commentItem = {
                    feedCommentId: result,
                    writerUserId: authenticationStore.state.signedUser.userId,
                    writerNickName: authenticationStore.state.signedUser.nickName,
                    writerPic: authenticationStore.state.signedUser.pic,
                    comment: state.comment,
                    isSelf: true,
                };

                state.commentList.unshift(commentItem);
                state.comment = '';
            }
        }

        const doGetCommentList = async () => { 
            if(state.isFinish) { return; }
            state.isLoading = true;
            const params = {
                feed_id: state.feedId
                , page: state.page++
                , size: state.size
            }
            const res = await getCommentList(params);
            if(res.status === 200) {
                state.commentList.push(...res.data.resultData);
                state.isFinish = res.data.resultData.length < state.size;
            }
            state.isLoading = false;
        };

        const doDeleteComment = async (feedCommentId, idx) => {
            if(!confirm('삭제하시겠습니까?')) {return};
            const params = {
                feed_comment_id: feedCommentId
            }
            const res = await deleteComment( params );
            if(res.status === 200) {
                state.commentList.splice(idx, 1); 
                //기존에 있는 배열에서 특정한 인덱스에 있는 친구 1개부터(하나만 삭제하겠다라는 뜻)라는 뜻.
                //2적으면 2개가 삭제됨. 실제로 데이터베이스 삭제는 아니고 화면에 보이는애들만 삭제
            }
        }

        return { state, close, setFeedId, doPostComment, doGetCommentList, doDeleteComment }
    }
);