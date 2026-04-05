const { gmd, gmdSticker, gmdRandom, runFFmpeg, getVideoDuration } = require("../gift");
const fs = require("fs").promises;
const { StickerTypes } = require("wa-sticker-formatter");

gmd({
    pattern: "sticker",
    alias: ["st", "take"],
    react: "🦋",
    desc: "Convert image/video/sticker to sticker.",
    category: "converter",
    filename: __filename
}, async (conn, mek, m, { reply, args, from, quoted, packName, packAuthor }) => {
    try {
        if (!quoted) {
            // ❌ Error reaction
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key }
            });
            return reply("Please reply to/quote an image, video, or sticker.");
        }

        const quotedImg = quoted?.imageMessage || quoted?.message?.imageMessage;
        const quotedSticker = quoted?.stickerMessage || quoted?.message?.stickerMessage;
        const quotedVideo = quoted?.videoMessage || quoted?.message?.videoMessage;

        if (!quotedImg && !quotedSticker && !quotedVideo) {
            // ❌ Error reaction
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key }
            });
            return reply("That quoted message is not an image, video, or sticker.");
        }

        // ♻️ Loading reaction
        await conn.sendMessage(from, {
            react: { text: "⏳", key: mek.key }
        });

        let tempFilePath;
        try {
            if (quotedImg || quotedVideo) {
                tempFilePath = await conn.downloadAndSaveMediaMessage(quotedImg || quotedVideo, "temp_media");
                let mediaFile = gmdRandom(quotedImg ? ".jpg" : ".mp4");

                const data = await fs.readFile(tempFilePath);
                await fs.writeFile(mediaFile, data);

                if (quotedVideo) {
                    const compressedFile = gmdRandom(".webp");
                    let duration = 8;
                    try { duration = await getVideoDuration(mediaFile); if (duration > 10) duration = 10; } 
                    catch(e) { console.error("Using default duration:", e); }

                    await runFFmpeg(mediaFile, compressedFile, 320, 15, duration);
                    await fs.unlink(mediaFile).catch(() => {});
                    mediaFile = compressedFile;
                }

                const stickerBuffer = await gmdSticker(mediaFile, {
                    pack: packName || "𝐀𝐓𝐀𝐒𝐒𝐀-𝐌𝐃",
                    author: packAuthor || "GIFTED-TECH",
                    type: args.includes("--crop") || args.includes("-c") ? StickerTypes.CROPPED : StickerTypes.FULL,
                    categories: ["🤩","🎉"],
                    id: "12345",
                    quality: 75,
                    background: "transparent"
                });

                await fs.unlink(mediaFile).catch(() => {});

                // ✅ Success reaction
                await conn.sendMessage(from, {
                    react: { text: "✅", key: mek.key }
                });

                return conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });
            } 
            else if (quotedSticker) {
                tempFilePath = await conn.downloadAndSaveMediaMessage(quotedSticker, "temp_media");
                const stickerData = await fs.readFile(tempFilePath);
                const stickerFile = gmdRandom(".webp");
                await fs.writeFile(stickerFile, stickerData);

                const newStickerBuffer = await gmdSticker(stickerFile, {
                    pack: packName || "𝐀𝐓𝐀𝐒𝐒𝐀-𝐌𝐃",
                    author: packAuthor || "GIFTED-TECH",
                    type: args.includes("--crop") || args.includes("-c") ? StickerTypes.CROPPED : StickerTypes.FULL,
                    categories: ["🤩","🎉"],
                    id: "12345",
                    quality: 75,
                    background: "transparent"
                });

                await fs.unlink(stickerFile).catch(() => {});

                // ✅ Success reaction
                await conn.sendMessage(from, {
                    react: { text: "✅", key: mek.key }
                });

                return conn.sendMessage(from, { sticker: newStickerBuffer }, { quoted: mek });
            }
        } finally {
            if (tempFilePath) await fs.unlink(tempFilePath).catch(() => {});
        }

    } catch(e) {
        console.error("Error in sticker command:", e);

        // ❌ Error reaction
        await conn.sendMessage(from, {
            react: { text: "❌", key: mek.key }
        });

        return reply("Failed to convert to sticker.");
    }
});