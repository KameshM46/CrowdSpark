const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const campaignRoutes = require("./routes/campaignRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/campaigns", campaignRoutes);

app.get("/", (req, res) => {
    res.send("Crowdspark Backend Running");
});

// Serve built React app if present
const path = require('path');
const fs = require('fs');
const distPath = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // fallback to index.html for client-side routing
    // fallback for client-side routing: serve index.html for non-API GET requests
    app.use((req, res, next) => {
        if (req.method !== 'GET') return next();
        if (req.path.startsWith('/auth') || req.path.startsWith('/campaigns')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.warn("No MONGO_URI provided. Continuing without a database connection.");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log("MongoDB Connected");
    } catch (err) {
        console.warn("MongoDB connection failed:", err.message);
    }
};

connectDB();

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});