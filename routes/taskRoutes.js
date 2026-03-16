const express = require("express");
const router = express.Router();

const {
    signup,
    login,
    refreshAccessToken,
    logout,
    getTasks,
    addData
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
 *                 example: ptuser
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
 *                 example: ptuser
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
 *                 example: ProjectCardView
 *               BeginDate:
 *                 type: string
 *                 example: 2026-03-01T00:00:00
 *               EndDate:
 *                 type: string
 *                 example: 2026-03-31T00:00:00
 *               json:
 *                 example:
 *                   TaskID: 123
 *     responses:
 *       200:
 *         description: Tasks fetched successfully
 */
router.post("/tasks", authenticateToken, getTasks);

/**
 * @swagger
 * /add-data:
 *   post:
 *     summary: Execute AddData procedure based on RequestParamType
 *     tags: [AddData]
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
 *                 example: AddChecklist
 *               json:
 *                 example:
 *                   TaskID: 123
 *                   ItemText: Checklist item from API
 *                   ItemMetaData: "{}"
 *     responses:
 *       200:
 *         description: AddData executed successfully
 */
router.post("/add-data", authenticateToken, addData);

module.exports = router;