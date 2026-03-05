import { reactive } from 'vue';
import { defineStore } from 'pinia';
import { postComment, getCommentList, deleteComment } from '@/services/feedCommentService';
import { useAuthenticationStore } from '@/stores/authentication';
import { useFeedStore } from '@/stores/feed'; //댓글 숫자올리기용
import { getCurrentTimestamp } from '@/utils/commonUtils';

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
            comment: '',
            createdAt: ''
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
        }

        const doPostComment = async () => {
            const authenticationStore = useAuthenticationStore();

            if (state.comment.trim().length === 0) {
                alert('댓글 내용을 작성해 주세요.'); // TODO - messageModal로 alert띄우기
                return;
            }

            const data = {
                feedId: state.feedId,
                comment: state.comment,
                createdAt: state.createdAt
            };

            const res = await postComment(data);
            if (res.status === 200) {
                const result = res.data.resultData;

                const commentItem = {
                    feedCommentId: result,
                    writerUserId: authenticationStore.state.signedUser.userId,
                    writerNickName: authenticationStore.state.signedUser.nickName,
                    writerPic: authenticationStore.state.signedUser.pic,
                    createdAt: state.createdAt,
                    feedId: state.feedId,
                    comment: state.comment,
                    createdAt: getCurrentTimestamp(),
                    isSelf: true,
                };

                state.commentList.unshift(commentItem); //0번 방에 item 추가. 가장위에(끝에) 붙이는 함수 -> unshift
                state.comment = '';

                //피드 댓글 수 수정
                const feedStore = useFeedStore();
                feedStore.commentCountUp(state.feedId);
            }
        }

        const doGetCommentList = async () => { 
            if(state.isLoading || state.isFinish || state.feedId === 0) { return; }
            state.isLoading = true;
            const params = {
                feed_id: state.feedId
                , page: state.page++
                , size: state.size
                , createdAt: state.createdAt
            }
            const res = await getCommentList(params);
            if(res.status === 200) {
                state.commentList.push(...res.data.resultData);
                state.isFinish = res.data.resultData.length < state.size;
            }
            state.isLoading = false;
        };

        const doDeleteComment = async (item) => {
            if(!confirm('삭제하시겠습니까?')) {return};
            const params = {
                feed_comment_id: item.feedCommentId
            }
            const res = await deleteComment( params );
            if(res.status === 200) {
                const idx = state.commentList.indexOf(item);
                state.commentList.splice(idx, 1);  //배열에서 아이템 삭제하는 방법
                //기존에 있는 배열에서 특정한 인덱스에 있는 친구 1개부터(하나만 삭제하겠다라는 뜻)라는 뜻.
                //2적으면 2개가 삭제됨. 실제로 데이터베이스 삭제는 아니고 화면에 보이는애들만 삭제

                const feedStore = useFeedStore();
                feedStore.commentCountDown(item.feedId);
            }
        }

        return { state, close, setFeedId, doPostComment, doGetCommentList, doDeleteComment }
    }
);