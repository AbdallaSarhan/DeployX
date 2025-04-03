import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import { generateId } from "./utils";
import path from "path";
import { getAllFiles } from "./file";
import { uploadFileToS3 } from "./aws";
import { createClient } from "redis";
const publisher = createClient()
publisher.connect().catch(console.error);

const app = express();
app.use(cors());
app.use(express.json());

app.post("/deploy", async (req, res) => {
    const repoUrl = req.body.repoUrl; // github.com/AbdallaSarhan/repo
    const id = generateId();
    await simpleGit().clone(repoUrl, path.join(__dirname, `./input/${id}`));
    const files = getAllFiles(path.join(__dirname, `./input/${id}`));
    // Upload every file to s3
    files.forEach(async (file) => {
        await uploadFileToS3(file.slice(__dirname.length + 1), file);
    }
    );
    // Push the id to the redis queue
    // This will be used by the worker nodes to build the project and process the deployment
    await publisher.lPush("build-queue", id);

    res.json({
        message: "Deployment started",
        repoUrl: repoUrl,
        id: id,
    });

})

app.listen(3000);
