const express = require("express");
const router = express.Router();

const {
    signup,
    login,
    refreshAccessToken,
    logout,
    getTasks
} = require("../controllers/taskController");

const authenticateToken = require("../middleware/authMiddleware");

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Create a new Node user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: pt@test.com
 *               email:
 *                 type: string
 *                 example: pt@test.com
 *               password:
 *                 type: string
 *                 example: Test@123
 *     responses:
 *       201:
 *         description: Signup successful
 */
router.post("/signup", signup);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login and get access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: pt@test.com
 *               password:
 *                 type: string
 *                 example: Test@123
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", login);

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Get a new access token using refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: your_refresh_token_here
 *     responses:
 *       200:
 *         description: New access token generated
 */
router.post("/refresh-token", refreshAccessToken);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Logout and clear refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: your_refresh_token_here
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", logout);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Get task data based on RequestParamType
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - RequestParamType
 *             properties:
 *               RequestParamType:
 *                 type: string
 *                 example: GetTasksByTypePriority
 *               BeginDate:
 *                 type: string
 *                 example: 2026-03-01T00:00:00
 *               EndDate:
 *                 type: string
 *                 example: 2026-03-31T00:00:00
 *               json:
 *                 type: string
 *                 example: "{\"key\":\"value\"}"
 *     responses:
 *       200:
 *         description: Tasks fetched successfully
 */
router.post("/tasks", authenticateToken, getTasks);

module.exports = router;