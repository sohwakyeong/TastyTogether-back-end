const { Review, Store, Users } = require('../data-access');
const asyncHandler = require('../utils/async-handler');

// 특정 리뷰 조회
const getReviewById = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const review = await Review.findOne({ _id: reviewId });
    res.json(review);
});

// 리뷰 생성
const test = {
    grade: 5,
    content: '맛나요',
    usernickname: '엘리스',
    username: '김토끼',
};

const createReview = asyncHandler(async (req, res) => {
    // 리뷰 객체 추가 => usernickname, username 로직 변경 필요
    const { storeId } = req.params;
    const { userId } = req.userData;
    const userInfo = await Users.findOne({ _id: userId });
    const { grade, content } = test;
    const { usernickname, username } = userInfo;
    // const { grade, content, usernickname, username } = req.body;
    if (!grade || !content) {
        const error = new Error('입력하지 않은 값이 존재합니다.');
        error.statusCode = 400;
        throw error;
    }
    const newReview = await Review.create({
        grade,
        content,
        usernickname,
        username,
        storeId,
        userId,
    });

    // store의 review 필드에 리뷰 아이디 추가
    const updatedStore = await Store.findOne({ _id: storeId });
    const { starRating, reviews } = updatedStore;

    // store의 별점 평균 추가 로직
    const updatedRating = (starRating * reviews.length + grade) / (reviews.length + 1);

    const updated = { reviews: [...reviews, newReview._id], starRating: updatedRating };
    await Store.findOneAndUpdate({ _id: storeId }, updated);
    res.status(201).json(newReview);
});

// 리뷰 수정
const testReview = {
    grade: 3,
    content: '직원이 불친절하다',
};

const editReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { grade, content } = testReview;
    // const { grade, content } = req.body;
    if (!grade || !content) {
        const error = new Error('입력하지 않은 값이 존재합니다.');
        error.statusCode = 400;
        throw error;
    }
    const previousReview = await Review.findOne({ _id: reviewId });
    const previousGrade = previousReview.grade;

    const updated = {
        grade,
        content,
    };

    const updatedReview = await Review.findOneAndUpdate({ _id: reviewId }, updated);
    const updatedStore = await Store.findOne({ _id: updatedReview.storeId });
    // 평균별점 업데이트 로직
    const { reviews, starRating } = updatedStore;
    const newRating = (starRating * reviews.length - previousGrade + grade) / reviews.length;
    const updatedRating = { starRating: newRating };

    await Store.findOneAndUpdate({ _id: updatedReview.storeId }, updatedRating);
    res.status(201).json(updatedStore);
});

// 리뷰 삭제
const deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const deletedReview = await Review.findOne({ _id: reviewId });
    const { storeId, grade } = deletedReview;

    const store = await Store.findOne({ _id: storeId });
    const { starRating, reviews } = store;

    // 평균별점 업데이트 로직
    const newRating = (starRating * reviews.length - grade) / (reviews.length - 1);
    const newReview = reviews.filter((review) => String(review) !== reviewId);
    console.log(newReview);
    const updated = { starRating: newRating, reviews: newReview };
    await Store.findOneAndUpdate({ _id: storeId }, updated);
    await Review.deleteOne({ _id: reviewId });
    res.sendStatus(200);
});

module.exports = {
    getReviewById,
    createReview,
    editReview,
    deleteReview,
};
