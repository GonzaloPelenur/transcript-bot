const { createEventAdapter } = require("@slack/events-api");
const { WebClient } = require("@slack/web-api");
const express = require("express");
require("dotenv").config();
// const fs = require("fs");
const path = require("path");
const transcribeAudio = require("./utils/transcribe");
const pdfToText = require("./utils/pdfToText");

const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const port = process.env.PORT || 3000;
const slackEvents = createEventAdapter(slackSigningSecret);

// Initialize an Express application
const expressApp = express();

// Plug the adapter into the Express application before body-parser
expressApp.use("/slack/events", slackEvents.expressMiddleware());

// Middleware to parse JSON request bodies, placed after slackEvents
expressApp.use(express.json());

// Handle file_shared events
slackEvents.on("file_shared", async (event) => {
    try {
        const client = new WebClient(process.env.SLACK_BOT_TOKEN);
        console.log("Received a file_shared event");
        const fileInfo = await client.files.info({ file: event.file_id });
        const file = fileInfo.file;
        const fileType = file.filetype;
        const fileName = path.parse(file.name).name;
        let content = "";

        if (
            fileType === "mp3" ||
            fileType === "mp4" ||
            fileType === "mpeg" ||
            fileType === "mpga" ||
            fileType === "m4a" ||
            fileType === "wav" ||
            fileType === "webm"
        ) {
            content = await transcribeAudio(file);
        } else if (fileType === "pdf") {
            content = await pdfToText(file, process.env.SLACK_BOT_TOKEN);
            // console.log(file);
        } else {
            return;
        }

        const buffer = Buffer.from(content, "utf8");
        const txtFileName = `${fileName}.txt`;

        console.log(`Uploading ${txtFileName} to channel ${event.channel_id}`);

        await client.files.uploadV2({
            channel_id: event.channel_id,
            initial_comment: "Here's the file you requested :)",
            filename: txtFileName,
            file: buffer,
        });
    } catch (error) {
        console.error(error);
    }
});

// Error handler for the event adapter
slackEvents.on("error", (error) => {
    console.error(`Error: ${error}`);
});

// Start the Express server
expressApp.listen(port, () => {
    console.log(`Listening for events on ${port}`);
});
