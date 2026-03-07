import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Only load .env.local in local development (Railway injects env vars directly)
if (fs.existsSync(".env.local")) {
    const dotenv = await import("dotenv");
    dotenv.config({ path: ".env.local" });
}

// Debug: Show ALL available env var keys
console.log("ALL ENV KEYS:", Object.keys(process.env).join(", "));

// --- Startup Env Check (helps debug Railway) ---
const requiredVars = [
    "OPENAI_API_KEY",
    "YOUTUBE_API_KEY",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
];
console.log("--- Environment Variable Check ---");
requiredVars.forEach(v => {
    console.log(`  ${v}: ${process.env[v] ? "✅ SET" : "❌ MISSING"}`);
});

const app = express();
app.use(cors({
    origin: ["http://localhost:3000", "https://sentitube.com", "https://www.sentitube.com"]
}));
app.use(express.json({ limit: "10mb" }));

// Health check endpoint (required by hosting platforms)
app.get("/", (req, res) => {
    res.json({ status: "ok", service: "Sentitube Backend" });
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/* -------------------------------------------------- */
/* SUPABASE CLIENT (for token persistence)            */
/* -------------------------------------------------- */
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* -------------------------------------------------- */
/* AI USAGE LIMITS (per-user daily quotas)            */
/* -------------------------------------------------- */
const USAGE_LIMITS = {
    free: {
        analysis: 2,
        categorize: 2,
        smart_reply: 5,
        content_ideas: 2,
        script: 1,
        followup_q: 2,
        followup_a: 2,
    },
    pro: {
        analysis: 50,
        categorize: 50,
        smart_reply: 200,
        content_ideas: 20,
        script: 20,
        followup_q: 50,
        followup_a: 100,
    }
};

function checkQuota(featureKey) {
    return async (req, res, next) => {
        const userId = req.body?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required for this feature" });
        }

        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            // Get user's plan (default to 'free')
            const { data: planData } = await supabase
                .from('user_plans')
                .select('plan')
                .eq('user_id', userId)
                .single();

            const plan = planData?.plan || 'free';
            const limit = USAGE_LIMITS[plan]?.[featureKey];

            if (limit === undefined) {
                return next(); // No limit configured, allow
            }

            // Get today's usage count
            const { data: usageData, error: usageError } = await supabase
                .from('user_daily_usage')
                .select('usage_count')
                .eq('user_id', userId)
                .eq('feature', featureKey)
                .eq('usage_date', today)
                .single();

            if (usageError && usageError.code !== 'PGRST116') {
                console.error(`[QUOTA] SELECT error for ${featureKey}:`, usageError.message);
            }

            const currentCount = usageData?.usage_count || 0;

            if (currentCount >= limit) {
                const tomorrow = new Date();
                tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
                tomorrow.setUTCHours(0, 0, 0, 0);

                return res.status(429).json({
                    error: "Daily limit reached",
                    feature: featureKey,
                    used: currentCount,
                    limit: limit,
                    plan: plan,
                    resetsAt: tomorrow.toISOString(),
                });
            }

            // Increment usage (upsert: insert if no row, update if exists)
            const { error: upsertError } = await supabase
                .from('user_daily_usage')
                .upsert({
                    user_id: userId,
                    feature: featureKey,
                    usage_date: today,
                    usage_count: currentCount + 1,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,feature,usage_date' });

            if (upsertError) {
                console.error('[QUOTA] UPSERT FAILED:', upsertError);
            }

            // Attach rollback in case AI call fails
            req.rollbackQuota = async () => {
                try {
                    await supabase
                        .from('user_daily_usage')
                        .update({
                            usage_count: currentCount,
                            updated_at: new Date().toISOString()
                        })
                        .eq('user_id', userId)
                        .eq('feature', featureKey)
                        .eq('usage_date', today);
                } catch (rbErr) {
                    console.error('Quota rollback error:', rbErr);
                }
            };

            next();
        } catch (err) {
            console.error('[QUOTA] Unexpected error:', err);
            // Don't block user if quota check itself fails
            next();
        }
    };
}

/* -------------------------------------------------- */
/* USAGE ENDPOINT (frontend can query remaining quota)*/
/* -------------------------------------------------- */
app.post("/usage", async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const today = new Date().toISOString().split('T')[0];

        // Get user's plan
        const { data: planData } = await supabase
            .from('user_plans')
            .select('plan')
            .eq('user_id', userId)
            .single();

        const plan = planData?.plan || 'free';
        const limits = USAGE_LIMITS[plan];

        // Get all of today's usage for this user
        const { data: usageRows } = await supabase
            .from('user_daily_usage')
            .select('feature, usage_count')
            .eq('user_id', userId)
            .eq('usage_date', today);

        const usageMap = {};
        (usageRows || []).forEach(row => {
            usageMap[row.feature] = row.usage_count;
        });

        // Build response
        const usage = {};
        for (const [feature, limit] of Object.entries(limits)) {
            usage[feature] = {
                used: usageMap[feature] || 0,
                limit: limit,
            };
        }

        const tomorrow = new Date();
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);

        res.json({ plan, usage, resetsAt: tomorrow.toISOString() });
    } catch (err) {
        console.error("Usage endpoint error:", err);
        res.status(500).json({ error: "Failed to fetch usage" });
    }
});

/* -------------------------------------------------- */
/* YOUTUBE OAUTH CONFIG & TOKEN STORE (SUPABASE)      */
/* -------------------------------------------------- */
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || "http://localhost:3000/youtube-callback";

function getOAuth2Client() {
    return new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        OAUTH_REDIRECT_URI
    );
}

// Save tokens to Supabase
async function saveTokens(userId, tokens) {
    const { error } = await supabase
        .from("youtube_tokens")
        .upsert({
            user_id: userId,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || null,
            expiry_date: tokens.expiry_date || null,
            updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

    if (error) console.error("Error saving tokens:", error);
}

// Get stored tokens from Supabase
async function getStoredTokens(userId) {
    const { data, error } = await supabase
        .from("youtube_tokens")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (error || !data) return null;
    return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expiry_date: data.expiry_date ? Number(data.expiry_date) : null,
    };
}

// Delete tokens from Supabase
async function deleteTokens(userId) {
    await supabase.from("youtube_tokens").delete().eq("user_id", userId);
}

// Get a valid (non-expired) access token, refreshing if needed
async function getValidToken(userId) {
    const tokens = await getStoredTokens(userId);
    if (!tokens) return null;

    // Check if token is expired (with 60s buffer)
    if (tokens.expiry_date && Date.now() > tokens.expiry_date - 60000) {
        try {
            const oauth2 = getOAuth2Client();
            oauth2.setCredentials(tokens);
            const { credentials } = await oauth2.refreshAccessToken();
            await saveTokens(userId, credentials);
            return credentials.access_token;
        } catch (err) {
            console.error("Token refresh failed:", err);
            await deleteTokens(userId);
            return null;
        }
    }
    return tokens.access_token;
}

/* -------------------------------------------------- */
/* 0. FETCH COMMENTS FROM YOUTUBE (WITH IDs)          */
/* -------------------------------------------------- */
app.post("/fetch-comments", async (req, res) => {
    try {
        const { videoId, userId } = req.body;
        const YT_KEY = process.env.YOUTUBE_API_KEY;

        let creatorChannelId = null;
        if (userId) {
            const token = await getValidToken(userId);
            if (token) {
                const chanRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=id&mine=true", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const chanData = await chanRes.json();
                creatorChannelId = chanData.items?.[0]?.id;
            }
        }

        const ytRes = await fetch(
            `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=80&key=${YT_KEY}`
        );

        const ytData = await ytRes.json();

        const comments = ytData.items?.map(item => {
            const topComment = item.snippet.topLevelComment;
            const replies = item.replies?.comments || [];

            // Check if creator's channel ID is in the replies
            const alreadyReplied = creatorChannelId
                ? replies.some(r => r.snippet.authorChannelId.value === creatorChannelId)
                : false;

            return {
                id: topComment.id,
                text: topComment.snippet.textDisplay,
                replyCount: item.snippet.totalReplyCount || 0,
                alreadyReplied
            };
        }) || [];

        res.json({ comments });
    } catch (err) {
        console.error("YouTube fetch error:", err);
        res.status(500).json({ comments: [] });
    }
});

/* -------------------------------------------------- */
/* 0.2 FETCH COMMENT REPLIES                         */
/* -------------------------------------------------- */
app.post("/fetch-replies", async (req, res) => {
    try {
        const { commentId } = req.body;
        const YT_KEY = process.env.YOUTUBE_API_KEY;

        const ytRes = await fetch(
            `https://www.googleapis.com/youtube/v3/comments?part=snippet&parentId=${commentId}&maxResults=50&key=${YT_KEY}`
        );

        const ytData = await ytRes.json();

        const replies = ytData.items?.map(item => ({
            id: item.id,
            text: item.snippet.textDisplay,
            author: item.snippet.authorDisplayName,
            publishedAt: item.snippet.publishedAt
        })) || [];

        res.json({ replies });
    } catch (err) {
        console.error("YouTube replies fetch error:", err);
        res.status(500).json({ replies: [] });
    }
});

/* -------------------------------------------------- */
/* 0.1 FETCH VIDEO METADATA                          */
/* -------------------------------------------------- */
app.post("/video-metadata", async (req, res) => {
    try {
        const { videoId } = req.body;
        const YT_KEY = process.env.YOUTUBE_API_KEY;

        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YT_KEY}`;
        const ytRes = await fetch(url);
        const ytData = await ytRes.json();

        if (ytData.items && ytData.items.length > 0) {
            const snippet = ytData.items[0].snippet;
            res.json({
                title: snippet.title,
                thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url
            });
        } else {
            res.status(404).json({ error: "Video not found" });
        }
    } catch (err) {
        console.error("Video metadata fetch error:", err);
        res.status(500).json({ error: "Failed to fetch video metadata" });
    }
});

/* -------------------------------------------------- */
/* YOUTUBE OAUTH: Generate Auth URL                   */
/* -------------------------------------------------- */
app.post("/youtube/auth-url", (req, res) => {
    try {
        const oauth2 = getOAuth2Client();
        const url = oauth2.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: ["https://www.googleapis.com/auth/youtube.force-ssl"],
        });
        res.json({ url });
    } catch (err) {
        console.error("Auth URL error:", err);
        res.status(500).json({ error: "Failed to generate auth URL" });
    }
});

/* -------------------------------------------------- */
/* YOUTUBE OAUTH: Exchange Code for Tokens            */
/* -------------------------------------------------- */
app.post("/youtube/callback", async (req, res) => {
    try {
        const { code, userId } = req.body;
        if (!code || !userId) {
            return res.status(400).json({ error: "Missing code or userId" });
        }

        const oauth2 = getOAuth2Client();
        const { tokens } = await oauth2.getToken(code);
        await saveTokens(userId, tokens);

        res.json({ success: true });
    } catch (err) {
        console.error("OAuth callback error:", err);
        res.status(500).json({ error: "Failed to exchange code for tokens" });
    }
});

/* -------------------------------------------------- */
/* YOUTUBE OAUTH: Check if user has valid token       */
/* -------------------------------------------------- */
app.post("/youtube/check-auth", async (req, res) => {
    try {
        const { userId } = req.body;
        const token = await getValidToken(userId);
        res.json({ connected: !!token });
    } catch (err) {
        res.json({ connected: false });
    }
});

/* -------------------------------------------------- */
/* POST REPLY TO YOUTUBE                              */
/* -------------------------------------------------- */
app.post("/post-reply", async (req, res) => {
    try {
        const { userId, commentId, replyText } = req.body;

        if (!userId || !commentId || !replyText) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const accessToken = await getValidToken(userId);
        if (!accessToken) {
            return res.status(401).json({ error: "YouTube not connected", needsAuth: true });
        }

        // Post the reply using YouTube Data API
        const ytRes = await fetch(
            "https://www.googleapis.com/youtube/v3/comments?part=snippet",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    snippet: {
                        parentId: commentId,
                        textOriginal: replyText,
                    },
                }),
            }
        );

        if (!ytRes.ok) {
            const errorData = await ytRes.json();
            console.error("YouTube post error:", errorData);

            // If 401, clear tokens so user re-auths
            if (ytRes.status === 401) {
                tokenStore.delete(userId);
                return res.status(401).json({ error: "Token expired", needsAuth: true });
            }

            return res.status(ytRes.status).json({ error: errorData.error?.message || "Failed to post reply" });
        }

        const data = await ytRes.json();
        res.json({ success: true, comment: data });
    } catch (err) {
        console.error("Post reply error:", err);
        res.status(500).json({ error: "Failed to post reply" });
    }
});

/* -------------------------------------------------- */
/* 1. STREAM SUMMARY + PERCENTAGES                    */
/* -------------------------------------------------- */
app.post("/analyze", checkQuota("analysis"), async (req, res) => {
    try {
        const { comments = [] } = req.body;
        const SAMPLE = comments.slice(0, 100);

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        res.setHeader("Access-Control-Allow-Origin", "*");

        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            stream: true,
            temperature: 0.3,
            messages: [{
                role: "user",
                content: `You are a professional YouTube comment sentiment analyst.

First, output the sentiment percentages on separate lines in this EXACT format:
Positive: [number]%
Negative: [number]%
Neutral: [number]%

Then provide your analysis using these EXACT sections with ## headings:

## Sentiment Summary
Summarize the overall comment sentiments.

## Topics of Discussion
Give an overview about the major topics being discussed by viewers.

## Actionable Insight for the Creator
Provide actionable insights that help the creator decide what to clarify, improve, or reconsider in future content. This is strictly based on audience reactions in the comments.

## Top Positive Feedbacks
- [Point 1]
- [Point 2]
- [Point 3]

## Main Concerns
- [Point 1]
- [Point 2]
- [Point 3]

FORMATTING RULES:
1. Use plain text ONLY. Do NOT use any HTML tags like <h2>, <p>, <ul>, <li>, etc.
2. Use ## for section headings. Do not use any other heading level.
3. Use - for bullet points.
4. Use **text** for bold or emphasis.
5. Separate sections with blank lines.
6. Do NOT wrap text in any HTML element.

COMMENTS:
${SAMPLE.join("\n")}
`
            }]
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }

        res.write(`data: [DONE]\n\n`);
        res.end();
    } catch (err) {
        console.error("Analyze error:", err);
        if (req.rollbackQuota) await req.rollbackQuota();
        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ error: "Analysis failed" })}\n\n`);
            res.end();
        } else {
            res.end();
        }
    }
});

/* -------------------------------------------------- */
/* 2. FOLLOW-UP QUESTIONS (STRICT JSON, NO STREAM)    */
/* -------------------------------------------------- */
app.post("/followup-questions", checkQuota("followup_q"), async (req, res) => {
    try {
        const { comments = [] } = req.body;
        const SAMPLE = comments.slice(0, 100);

        const result = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.2,
            messages: [{
                role: "user",
                content: `
From these YouTube comments, generate 4 FOLLOW-UP QUESTIONS
that would be helpful for the creator understand audience. questions are for creator about comments written by viewers

Return ONLY valid JSON in this exact format:

{
  "questions": [
    "string",
    "string",
    "string",
    "string"
  ]
}

COMMENTS:
${SAMPLE.join("\n")}
`
            }]
        });

        const raw = result.choices[0].message.content;
        const json = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);

        res.json(json);
    } catch (err) {
        console.error("Follow-up JSON error:", err);
        if (req.rollbackQuota) await req.rollbackQuota();
        res.status(500).json({ questions: [] });
    }
});

/* -------------------------------------------------- */
/* 3. STREAM ANSWER FOR CLICKED QUESTION              */
/* -------------------------------------------------- */
app.post("/followup-answer", checkQuota("followup_a"), async (req, res) => {
    try {
        const { comments = [], question } = req.body;
        const SAMPLE = comments.slice(0, 100);

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders();

        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            stream: true,
            temperature: 0.3,
            messages: [{
                role: "user",
                content: `
Answer this question using the YouTube comments context.dont make the answer too lengthier.
Use plain text.

QUESTION:
${question}

COMMENTS:
${SAMPLE.join("\n")}
`
            }]
        });

        for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content;
            if (token) {
                res.write(token);
            }
        }

        res.end();
    } catch (err) {
        console.error("Follow-up answer error:", err);
        if (req.rollbackQuota) await req.rollbackQuota();
        res.end();
    }
});

/* -------------------------------------------------- */
/* 4. CATEGORIZE COMMENTS (FOR REPLY GENERATOR)       */
/* -------------------------------------------------- */
app.post("/categorize-comments", checkQuota("categorize"), async (req, res) => {
    try {
        const { comments = [] } = req.body;
        const SAMPLE = comments.slice(0, 50); // Fetch 50 comments as requested

        const result = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0,
            messages: [{
                role: "user",
                content: `
Categorize each of these YouTube comments into one of three sentiments: "positive", "negative", or "neutral".

Return ONLY valid JSON in this exact format:
{
  "categorized": [
    { "text": "comment text", "sentiment": "positive" },
    ...
  ]
}

COMMENTS:
${SAMPLE.join("\n---COMMENT_BREAK---\n")}
`
            }]
        });

        const raw = result.choices[0].message.content;
        const json = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);

        res.json(json);
    } catch (err) {
        console.error("Categorize error:", err);
        if (req.rollbackQuota) await req.rollbackQuota();
        res.status(500).json({ categorized: [] });
    }
});

/* -------------------------------------------------- */
/* 5. GENERATE SMART REPLY (JSON RESPONSE)            */
/* -------------------------------------------------- */
app.post("/generate-smart-reply", checkQuota("smart_reply"), async (req, res) => {
    try {
        const { videoTitle, commentText } = req.body;

        const result = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            messages: [{
                role: "user",
                content: `
You are helping a YouTube creator reply to a viewer comment.

First understand the sentiment of the comment, the tone of reply should be based on that.
Reply should be satisfactory for both creator and commenter, don't make anyone upset.

Write a reply that:
- Does NOT end the conversation
- Encourages further discussion or clarification
- Avoids generic phrases like "thanks for watching"
- Stays calm and professional, even if the comment is critical
- Sounds human and natural

Keep it concise (1–2 sentences).

VIDEO TITLE:
"${videoTitle}"

COMMENT:
"${commentText}"
`
            }]
        });

        res.json({ reply: result.choices[0].message.content });
    } catch (err) {
        console.error("Reply generation error:", err);
        if (req.rollbackQuota) await req.rollbackQuota();
        res.status(500).json({ reply: "Sorry, I couldn't generate a reply at this time." });
    }
});

/* -------------------------------------------------- */
/* 6. SUGGEST CONTENT IDEAS                          */
/* -------------------------------------------------- */
app.post("/suggest-content-ideas", checkQuota("content_ideas"), async (req, res) => {
    try {
        const { channelHandle, excludeTitles = [] } = req.body;
        if (!channelHandle) {
            return res.status(400).json({ error: "Missing channel handle" });
        }

        const API_KEY = process.env.YOUTUBE_API_KEY;
        let handle = channelHandle.trim();
        if (handle.startsWith('@')) handle = handle.substring(1);

        // 1. Get Channel ID
        const channelResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${handle}&key=${API_KEY}`
        );
        const channelData = await channelResponse.json();

        if (!channelData.items || channelData.items.length === 0) {
            return res.status(404).json({ error: "Channel not found" });
        }
        const channelId = channelData.items[0].id;

        // 2. Fetch latest 8 videos
        const videosSearchRes = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=8&order=date&type=video&key=${API_KEY}`
        );
        const videosSearchData = await videosSearchRes.json();
        const videoIds = (videosSearchData.items || []).map(v => v.id.videoId);

        if (videoIds.length === 0) {
            return res.status(404).json({ error: "No videos found for this channel" });
        }

        // 3. Get detailed stats for these videos
        const statsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(",")}&key=${API_KEY}`
        );
        const statsData = await statsRes.json();

        const videoPerformance = statsData.items.map(v => ({
            title: v.snippet.title,
            views: v.statistics.viewCount,
            likes: v.statistics.likeCount || 0
        }));

        // 4. Prompt AI for content ideas
        const prompt = `
        As an expert YouTube strategist, analyze the performance of these recent videos:
        ${videoPerformance.map(v => `- "${v.title}" (Views: ${v.views}, Likes: ${v.likes})`).join("\n")}

        Based on these trends, generate 4 new high-potential content ideas.
        
        ${excludeTitles.length > 0 ? `CRITICAL: suggest content ideas that are different from these,but at the same time remember that the niche of the channel is related to this: \n${excludeTitles.join(", ")}` : ""}

        For each idea, provide:
        1. A catchy video title.
        2. A brief 1-sentence description.
        3. An engagement score (1 to 10) representing its potential success.

        Return ONLY valid JSON in this exact format:
        {
          "ideas": [
            { "title": "...", "description": "...", "engagementScore": 9.5 },
            ...
          ]
        }
        `;

        const result = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.85,
            messages: [{ role: "user", content: prompt }]
        });

        const raw = result.choices[0].message.content;
        const json = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);

        res.json(json);
    } catch (err) {
        console.error("Suggest ideas error:", err);
        if (req.rollbackQuota) await req.rollbackQuota();
        res.status(500).json({ error: "Failed to generate ideas" });
    }
});

/* -------------------------------------------------- */
/* 7. SCRIPT GENERATOR (STREAMING)                    */
/* -------------------------------------------------- */
app.post("/generate-script", checkQuota("script"), async (req, res) => {
    try {
        const { prompt, videoType, duration, tone } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Missing prompt" });
        }

        const videoTypeLabel = videoType === "short" ? "YouTube Short (vertical)" : "Long-form YouTube video";
        const durationLabel = duration === "60s" ? "60 seconds" : `${duration} minutes`;

        const systemPrompt = `You are an expert YouTube scriptwriter. Generate a complete, ready-to-read video script.

Format the script with clear sections:
- HOOK (first 10-15 seconds to grab attention)
- INTRO (introduce the topic)
- MAIN CONTENT (divided into clear sections/chapters)
- CALL TO ACTION
- OUTRO

Use markdown formatting:
- **Bold** for section headers
- Use line breaks between sections
- Include [VISUAL CUE] suggestions in brackets where relevant
- Include estimated timestamps

Make the script engaging, conversational, and optimized for viewer retention.`;

        const userPrompt = `Generate a ${videoTypeLabel} script.
Duration: ${durationLabel}
Tone: ${tone}
Topic/Idea: ${prompt}

Write the complete script now:`;

        // Set up SSE headers for streaming
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Access-Control-Allow-Origin", "*");

        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.8,
            max_tokens: 4000,
            stream: true,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }

        res.write(`data: [DONE]\n\n`);
        res.end();

    } catch (err) {
        console.error("Script generation error:", err);
        if (req.rollbackQuota) await req.rollbackQuota();
        // If headers already sent, just end
        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ error: "Generation failed" })}\n\n`);
            res.end();
        } else {
            res.status(500).json({ error: "Failed to generate script" });
        }
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
