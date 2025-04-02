import fs from 'fs';
import path from 'path';

export const getAllFiles = (folderPath: string): string[] => {
    let files: string[] = [];
    const allFilesAndFolders = fs.readdirSync(folderPath);

    allFilesAndFolders.forEach((fileOrFolder) => {
        const fullPath = path.join(folderPath, fileOrFolder);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            files = [...files, ...getAllFiles(fullPath)];
        } else {
            files.push(fullPath);
        }
    });

    return files;
}