// transcribe.js
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const OpenAI = require("openai");
const dotenv = require("dotenv");

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY; // Replace with your actual API key
const openai = new OpenAI({ apiKey });

async function downloadAndChunkAudio(url, fileName, slackToken) {
    const CHUNK_SIZE = 23 * 1024 * 1024; // 25 MB
    const filePaths = [];

    try {
        const response = await axios({
            url,
            method: "GET",
            responseType: "stream",
            headers: {
                Authorization: `Bearer ${slackToken}`,
            },
        });

        // Create a write stream to download the original file
        const originalFilePath = path.resolve(__dirname, fileName);
        const writer = fs.createWriteStream(originalFilePath);

        response.data.pipe(writer);

        // Wait for the download to complete
        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        // Now read the downloaded file and create chunks
        const stats = fs.statSync(originalFilePath);
        const totalSize = stats.size;
        let bytesRead = 0;
        let chunkIndex = 0;

        const readStream = fs.createReadStream(originalFilePath, {
            highWaterMark: CHUNK_SIZE,
        });

        for await (const chunk of readStream) {
            const chunkFileName = `${path.basename(
                fileName,
                path.extname(fileName)
            )}_chunk${chunkIndex}${path.extname(fileName)}`;
            const chunkFilePath = path.resolve(__dirname, chunkFileName);

            fs.writeFileSync(chunkFilePath, chunk);
            filePaths.push(chunkFilePath);

            chunkIndex++;
            bytesRead += chunk.length;
        }

        // Clean up the original file if needed
        fs.unlinkSync(originalFilePath);

        return filePaths;
    } catch (error) {
        console.error("Error downloading or chunking the file:", error);
        throw error;
    }
}

function deleteChunkFiles(chunkFilePaths) {
    chunkFilePaths.forEach((filePath) => {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
            } else {
                console.log(`File not found: ${filePath}`);
            }
        } catch (error) {
            console.error(`Error deleting file: ${filePath}`, error);
        }
    });
}

async function transcribeAudio(file) {
    const chunkFilePaths = await downloadAndChunkAudio(
        file.url_private_download,
        file.name,
        process.env.SLACK_BOT_TOKEN
    );
    console.log("File chunks created:", chunkFilePaths);
    var allTranscriptions = "";
    for (const chunkFilePath of chunkFilePaths) {
        console.log("Transcribing chunk:", chunkFilePath);
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(chunkFilePath),
            model: "whisper-1",
        });
        console.log("Transcription:", transcription);
        allTranscriptions += transcription.text;
    }
    deleteChunkFiles(chunkFilePaths);
    // console.log(transcription);
    // // await deleteAudioFile(fileName);
    // return transcription.text;
    return allTranscriptions;
}

// main(); // Uncomment if you have a main function to call

module.exports = transcribeAudio;