const successResponse = (res, message, data = null) => {
    return res.json({
        success: true,
        message: message,
        data: data
    });
};

const errorResponse = (res, message, status = 400) => {
    return res.status(status).json({
        success: false,
        message: message
    });
};

module.exports = { successResponse, errorResponse };