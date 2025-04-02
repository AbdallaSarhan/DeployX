import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import { generateId } from "./utils";
import path from "path";
import { getAllFiles } from "./file";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/deploy", async (req, res) => {
    const repoUrl = req.body.repoUrl; // github.com/AbdallaSarhan/repo
    const id = generateId();
    await simpleGit().clone(repoUrl, path.join(__dirname, `./output/${id}`));
    const files = getAllFiles(path.join(__dirname, `./output/${id}`));
    // TODO: Upload every file to s3
    res.json({
        message: "Deployment started",
        repoUrl: repoUrl,
        id: id,
    });

})

app.listen(3000);
