const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sql, connectDB } = require("../config/db");

// ================= SIGNUP =================
const signup = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            error: "username, email and password are required"
        });
    }

    try {
        const pool = await connectDB();

        const existingNodeUser = await pool.request()
            .input("UserName", sql.NVarChar(200), username)
            .input("Email", sql.NVarChar(255), email)
            .query(`
                SELECT NodeUserId, UserName, Email
                FROM AKRA_taskQ.dbo.NodeUsers
                WHERE UserName = @UserName OR Email = @Email
            `);

        if (existingNodeUser.recordset.length > 0) {
            return res.status(409).json({
                error: "Username or email already exists in NodeUsers"
            });
        }

        const existingBusinessUser = await pool.request()
            .input("Email", sql.NVarChar(255), email)
            .query(`
                SELECT UserId, UserName, UserEmail, NodeUserId
                FROM AKRA_taskQ.dbo.Users
                WHERE UserEmail = @Email
            `);

        if (existingBusinessUser.recordset.length === 0) {
            return res.status(404).json({
                error: "No matching user found in Users table for this email"
            });
        }

        const businessUser = existingBusinessUser.recordset[0];

        if (businessUser.NodeUserId) {
            return res.status(409).json({
                error: "This Users record is already linked to a Node login"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const insertResult = await pool.request()
            .input("UserName", sql.NVarChar(200), username)
            .input("Email", sql.NVarChar(255), email)
            .input("PasswordHash", sql.NVarChar(500), passwordHash)
            .query(`
                INSERT INTO AKRA_taskQ.dbo.NodeUsers (UserName, Email, PasswordHash)
                OUTPUT inserted.NodeUserId, inserted.UserName, inserted.Email
                VALUES (@UserName, @Email, @PasswordHash)
            `);

        const newNodeUser = insertResult.recordset[0];

        await pool.request()
            .input("NodeUserId", sql.UniqueIdentifier, newNodeUser.NodeUserId)
            .input("Email", sql.NVarChar(255), email)
            .query(`
                UPDATE AKRA_taskQ.dbo.Users
                SET NodeUserId = @NodeUserId
                WHERE UserEmail = @Email
            `);

        return res.status(201).json({
            message: "Signup successful",
            nodeUserId: newNodeUser.NodeUserId,
            linkedEmail: email
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Signup failed",
            details: err.message
        });
    }
};

// ================= LOGIN =================
const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: "username and password are required"
        });
    }

    try {
        const pool = await connectDB();

        const result = await pool.request()
            .input("UserName", sql.NVarChar(200), username)
            .query(`
                SELECT NodeUserId, UserName, Email, PasswordHash, IsActive
                FROM AKRA_taskQ.dbo.NodeUsers
                WHERE UserName = @UserName
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                error: "Invalid username or password"
            });
        }

        const user = result.recordset[0];

        if (!user.IsActive) {
            return res.status(403).json({
                error: "User is inactive"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: "Invalid username or password"
            });
        }

        const accessToken = jwt.sign(
            {
                userid: user.NodeUserId,
                username: user.UserName,
                email: user.Email
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        const refreshToken = crypto.randomBytes(64).toString("hex");
        const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await pool.request()
            .input("NodeUserId", sql.UniqueIdentifier, user.NodeUserId)
            .input("RefreshToken", sql.NVarChar(500), refreshToken)
            .input("RefreshTokenExpiry", sql.DateTime, refreshTokenExpiry)
            .query(`
                UPDATE AKRA_taskQ.dbo.NodeUsers
                SET RefreshToken = @RefreshToken,
                    RefreshTokenExpiry = @RefreshTokenExpiry
                WHERE NodeUserId = @NodeUserId
            `);

        return res.json({
            message: "Login successful",
            token: accessToken,
            refreshToken: refreshToken,
            userid: user.NodeUserId
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Login failed",
            details: err.message
        });
    }
};

// ================= REFRESH TOKEN =================
const refreshAccessToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            error: "refreshToken is required"
        });
    }

    try {
        const pool = await connectDB();

        const result = await pool.request()
            .input("RefreshToken", sql.NVarChar(500), refreshToken)
            .query(`
                SELECT NodeUserId, UserName, Email, IsActive, RefreshTokenExpiry
                FROM AKRA_taskQ.dbo.NodeUsers
                WHERE RefreshToken = @RefreshToken
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                error: "Invalid refresh token"
            });
        }

        const user = result.recordset[0];

        if (!user.IsActive) {
            return res.status(403).json({
                error: "User is inactive"
            });
        }

        if (!user.RefreshTokenExpiry || new Date(user.RefreshTokenExpiry) < new Date()) {
            return res.status(401).json({
                error: "Refresh token expired"
            });
        }

        const newAccessToken = jwt.sign(
            {
                userid: user.NodeUserId,
                username: user.UserName,
                email: user.Email
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.json({
            message: "New access token generated",
            token: newAccessToken
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Refresh token failed",
            details: err.message
        });
    }
};

// ================= LOGOUT =================
const logout = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            error: "refreshToken is required"
        });
    }

    try {
        const pool = await connectDB();

        await pool.request()
            .input("RefreshToken", sql.NVarChar(500), refreshToken)
            .query(`
                UPDATE AKRA_taskQ.dbo.NodeUsers
                SET RefreshToken = NULL,
                    RefreshTokenExpiry = NULL
                WHERE RefreshToken = @RefreshToken
            `);

        return res.json({
            message: "Logout successful"
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "Logout failed",
            details: err.message
        });
    }
};

// ================= GET TASKS =================
const getTasks = async (req, res) => {
    const requestType = req.query.type;
    const userId = req.user.userid;

    if (!requestType) {
        return res.status(400).json({
            error: "type parameter is required"
        });
    }

    try {
        const pool = await connectDB();

        const result = await pool.request()
            .input("RequestParamType", sql.VarChar(200), requestType)
            .input("UserId", sql.NVarChar(256), userId)
            .input("BeginDate", sql.SmallDateTime, null)
            .input("EndDate", sql.SmallDateTime, null)
            .input("json", sql.NVarChar(sql.MAX), null)
            .execute("GetAPIData");

        return res.json({
            success: true,
            data: result.recordset
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Procedure execution failed",
            details: err.message
        });
    }
};

module.exports = { signup, login, refreshAccessToken, logout, getTasks };