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

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logout);
router.get("/tasks", authenticateToken, getTasks);

module.exports = router;