const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const path = require('path');

// @desc      Get all users
// @route     GET /api/v1/auth/users
// @access    Private/Admin
exports.getUsers = asyncHandler(async(req, res, next) => {
    res.status(200).json(res.advancedResults);
});

// @desc      Get single user
// @route     GET /api/v1/auth/users/:id
// @access    Private/Admin
exports.getUser = asyncHandler(async(req, res, next) => {
    const user = await User.findById(req.params.id);

    res.status(200).json({
        success: true,
        data: user,
    });
});

// @desc      Create user
// @route     POST /api/v1/auth/users
// @access    Private/Admin
exports.createUser = asyncHandler(async(req, res, next) => {
    const user = await User.create(req.body);

    res.status(201).json({
        success: true,
        data: user,
    });
});

// @desc      Update user
// @route     PUT /api/v1/auth/users/:id
// @access    Private/Admin
exports.updateUser = asyncHandler(async(req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: user,
    });
});

// @desc      Delete user
// @route     DELETE /api/v1/auth/users/:id
// @access    Private/Admin
exports.deleteUser = asyncHandler(async(req, res, next) => {
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        data: {},
    });
});

// @desc      Upload photo for user
// @route     PUT /api/v1/users/:id/photo
// @access    Private
exports.userPhotoUpload = asyncHandler(async(req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(
            new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
        );
    }

    // Make sure user is bootcamp owner
    // if (user.user.toString() !== req.user.id && req.user.role !== 'admin') {
    //     return next(
    //         new ErrorResponse(
    //             `User ${req.params.id} is not authorized to update this user`,
    //             401
    //         )
    //     );
    // }

    if (!req.files) {
        return next(new ErrorResponse(`Please upload a file`, 400));
    }

    const file = req.files.file;

    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse(`Please upload an image file`, 400));
    }

    // Check filesize
    console.log(file.size);
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        const mb = process.env.MAX_FILE_UPLOAD / 1000000;
        return next(
            new ErrorResponse(`Please upload an image less than ${mb} Megabyte`, 400)
        );
    }

    // Create custom filename
    file.name = `photo_${user._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.FILE_USERUPLOAD_PATH}/${file.name}`, async(err) => {
        if (err) {
            console.error(err);
            return next(new ErrorResponse(`Problem with file upload`, 500));
        }

        await User.findByIdAndUpdate(req.params.id, { photo: file.name });

        res.status(200).json({
            success: true,
            data: file.name,
        });
    });
});