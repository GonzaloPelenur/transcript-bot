const axios = require("axios");
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

async function downloadPdfFile(file, slackToken) {
    const filePath = path.resolve(__dirname, file.name);

    try {
        const response = await axios({
            url: file.url_private_download,
            method: "GET",
            responseType: "stream",
            headers: {
                Authorization: `Bearer ${slackToken}`,
            },
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        console.log(`File downloaded: ${filePath}`);
        return filePath;
    } catch (error) {
        console.error("Error downloading the file:", error);
        throw error;
    }
}

async function extractTextFromPdf(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (error) {
        console.error("Error extracting text from PDF:", error);
        throw error;
    }
}

async function deletePdfFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`File deleted: ${filePath}`);
        } else {
            console.log(`File not found: ${filePath}`);
        }
    } catch (error) {
        console.error("Error deleting the file:", error);
        throw error;
    }
}

async function pdfToText(file, slackToken) {
    try {
        const filePath = await downloadPdfFile(file, slackToken);
        const text = await extractTextFromPdf(filePath);
        // console.log("Text extracted from PDF:", text);
        deletePdfFile(filePath);
        return text;
    } catch (error) {
        console.error("Error converting PDF to text:", error);
        throw error;
    }
}

module.exports = pdfToText;