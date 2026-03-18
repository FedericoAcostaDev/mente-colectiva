const express = require('express');
const authorization = require('../middleware/authorization');
const { GoogleGenAI } = require('@google/genai')
const router = express.Router();

//import model
const Room = require('../models/roomModel')

//Google Ai api integration
const ai = new GoogleGenAI(
    {
        apiKey: process.env.GEMINIAPIKEY
    }
)

//gemini summary router
router.post('/:id', authorization, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        //finding room validation
        const room = await Room.findOne({ roomId: id });
        if (!room) {
            return res.status(404).json({ success: false, msg: "Room not found" });
        }
        if (!room.boardData) {
            return res.status(400).json({ success: false, msg: "No board data available" });
        }

        //prompt
        const prompt = `You are an AI that interprets and summarizes digital whiteboards.

First, internally combine and analyze ALL whiteboard objects together — shapes, drawings, arrows, text, and layout — as a single unified scene. Understand the full picture, not each object separately.

Return your final output INSIDE a <pre>...</pre> block to preserve formatting, indentation, bullet points, and spacing for easy copying.

Your task:
Using the combined scene understanding, produce a clear, human-friendly summary in TWO sections:

1. **What is on the Screen**
   - Describe the overall visual structure of the board.
   - Explain what groups, shapes, drawings, or text appear.
   - Describe relative positioning and layout so the user understands the scene.
   - Do NOT mention JSON, Fabric.js, or technical object names.

2. **Possible Meaning Behind the Drawing**
   - Infer what the user may have been trying to express.
   - Explain the likely idea, concept, comparison, process, or diagram represented.
   - Provide 2–3 possible interpretations (practical, conceptual, creative).
   - Keep explanations simple, direct, and in everyday easy-to-understand language.

Formatting Requirements:
- Use bullet points where suitable.
- Keep the summary compact, meaningful, and to the point.
- Preserve indentation and spacing.
- The entire response must be wrapped inside a <pre> block.

Whiteboard Data:
${room.boardData}

`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        //generated output
        const output = response.candidates?.[0]?.content?.parts?.[0]?.text || "No summary generated"; // get generated text

        return res.json({ success: true, output });

    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: err.msg });
    }
})




module.exports = router