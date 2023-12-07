const { Comment } = require('../data-access');
/**
 * 새로운 댓글을 생성.
 * @param {object} req -댓글 데이터와 사용자 정보.
 */
const postComments = async (req, res) => {
    const { content } = req.body;
    const { userId } = req.userData;
    const boardId = req.params.id;

    if (!userId || !content || !boardId) {
        return res.status(400).end();
    }
    try {
        const comment = new Comment({ userId, content, boardId });
        const savedComment = await comment.save();

        const populatedComment = await Comment.findById(savedComment._id).populate('userId', [
            'nickname',
            'profileImage',
        ]);
        let formattedDate;
        if (populatedComment.createdAt) {
            const date = new Date(populatedComment.createdAt);
            [formattedDate] = date.toISOString().split('T');
        }
        const responseObject = {
            ...populatedComment._doc,
            createdAt: formattedDate,
        };

        res.status(201).json(responseObject);
    } catch (err) {
        console.error(err.message);
        res.status(500).end();
    }
};
/**
 * 특정 댓글을 삭제.
 * @param {object} req - 사용자 인증 정보와 댓글 ID.
 */
const deleteComments = async (req, res) => {
    try {
        const { userId } = req.userData;
        const commentId = req.params.id;

        const comment = await Comment.findById(commentId);

  
        if (!comment || String(comment.userId) !== String(userId)) {
            return res.status(403).json({ message: "You can't delete this comment" });
        }
        await Comment.findByIdAndDelete(commentId);

        res.status(200).end();
    } catch (err) {
        console.error(err.message);
        res.status(500).end();
    }
};
/**
 * 특정 댓글의 상세 정보를 조회.
 * @param {object} req -조회할 댓글의 ID.
 */
// eslint-disable-next-line consistent-return
const getComments = async (req, res) => {
    const commentId = req.params.id;
    try {
        const comment = await Comment.findOne({ _id: commentId }).populate('userId', 'nickname');
        if (!comment) {
            return res.status(404).end();
        }
        return res.status(200).json(comment);
    } catch (err) {
        console.error(err.message);
        res.status(500).end();
    }
};

module.exports = { postComments, deleteComments, getComments };
