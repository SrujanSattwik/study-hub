// server.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const materialsRouter = require('./routes/materials');

const app = express();
const PORT = 5500;

const GEMINI_API_KEY = "AIzaSyCGe_4efn5LSsp1_1IKF9_jen3nM-bpdaQ";

app.use(cors());
app.use(bodyParser.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Materials API
app.use('/api/materials', materialsRouter);

app.post("/api/ask", async (req, res) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ answer: "No question provided." });

    try {
        const response = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            {
                contents: [{ parts: [{ text: question }] }]
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-goog-api-key": GEMINI_API_KEY
                }
            }
        );

        // Log the full response for debugging
        console.log("Full Gemini API response:", JSON.stringify(response.data, null, 2));

        // Safely extract all text parts from candidates
        let answer = "No answer found.";
        if (response.data?.candidates?.length) {
            answer = response.data.candidates.map(candidate => {
                if (candidate?.content?.length) {
                    return candidate.content.map(c => c.text).join("\n");
                }
                return "";
            }).join("\n");
        }

        res.json({ answer });

    } catch (err) {
        console.error("Gemini API error:", err.response?.data || err.message);
        res.status(500).json({ answer: "Error contacting Gemini API." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
// Make sure to run `npm install express axios cors body-parser` before starting the server.