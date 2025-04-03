import { S3 } from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
// This file is responsible for downloading files from AWS S3
// It uses the AWS SDK to download files from S3

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.AWS_S3_ENDPOINT, // Optional: specify the endpoint if using a custom S3-compatible service like CloudFlare R2
});

export async function downloadS3Folder(prefix: string){
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
        throw new Error("AWS credentials are not set in environment variables");
    }
    const allFiles = await s3.listObjectsV2({
        Bucket: process.env.AWS_S3_BUCKET_NAME as string,
        Prefix: prefix
    }).promise();

    const allPromises = allFiles.Contents?.map(async ({Key}) => {
        return new Promise(async (resolve) => {
            if (!Key) {
                resolve("");
                return;
            }
            const finalOutputPath = path.join(__dirname, Key); // dist/output/12345/src/App.jsx
            const outputFile = fs.createWriteStream(finalOutputPath); // for downloading big files in a stream
            const dirName = path.dirname(finalOutputPath);
            if (!fs.existsSync(dirName)){
                fs.mkdirSync(dirName, { recursive: true });
            }
            s3.getObject({
                Bucket: process.env.AWS_S3_BUCKET_NAME as string,
                Key
            }).createReadStream().pipe(outputFile).on("finish", () => {
                resolve("");
            })
        })
    }) || []
    console.log("awaiting");

    await Promise.all(allPromises?.filter(x => x !== undefined));
    
}
