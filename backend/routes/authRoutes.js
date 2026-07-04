const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const router = express.Router();
const User = require("../models/User");

let memoryUsers = [];

const createToken = (user) => jwt.sign(
    { id: user._id || user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "crowdspark-secret",
    { expiresIn: "7d" }
);

const sanitizeUser = (user) => {
    const plainUser = user.toObject ? user.toObject() : { ...user };
    delete plainUser.password;
    return plainUser;
};

const findUser = async (email) => {
    const normalizedEmail = String(email).trim().toLowerCase();

    if (mongoose.connection.readyState === 1) {
        return User.findOne({ email: normalizedEmail });
    }

    return memoryUsers.find((user) => user.email === normalizedEmail) || null;
};

const saveUser = async (userData) => {
    if (mongoose.connection.readyState === 1) {
        const user = new User(userData);
        await user.save();
        return user;
    }

    const storedUser = {
        id: `${Date.now()}`,
        ...userData,
        email: String(userData.email).trim().toLowerCase(),
    };
    memoryUsers.push(storedUser);
    return storedUser;
};

router.post("/signup", async (req, res) => {
    try {
        const { username, firstName, email, password, role } = req.body;
        const normalizedEmail = String(email).trim().toLowerCase();

        const existingUser = await findUser(normalizedEmail);
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await saveUser({
            username,
            firstName,
            email: normalizedEmail,
            password: hashedPassword,
            role: role || "backer",
        });

        res.status(201).json({
            message: "Account created successfully",
            token: createToken(user),
            user: sanitizeUser(user),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await findUser(normalizedEmail);

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ message: "Incorrect password" });
        }

        res.status(200).json({
            message: "Login successful",
            token: createToken(user),
            user: sanitizeUser(user),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;