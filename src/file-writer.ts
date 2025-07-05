import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as jsonpatch from 'json-patch';
import { unescapeString } from './utils';

export class FileWriter {
    private workspacePath: string;
    private log: (message: string) => void;

    constructor(workspacePath: string, log: (message: string) => void) {
        this.workspacePath = workspacePath;
        this.log = log;
    }

    async createFile(filePath: string, content: string): Promise<any> {
        if (!filePath || typeof filePath !== 'string' || content === undefined) {
            this.log(`ERREUR: filePath ou content manquant pour create-file`);
            throw new Error('filePath (chaîne) et content sont requis pour create-file.');
        }

        this.log(`Commande "create-file" reçue pour le fichier: ${filePath}`);
        try {
            const fullPath = path.join(this.workspacePath, filePath);
            const fileUri = vscode.Uri.file(fullPath);
            if (fs.existsSync(fullPath)) {
                this.log(`ERREUR: Le fichier ${filePath} existe déjà`);
                throw new Error(`Le fichier ${filePath} existe déjà.`);
            }

            const dirPath = path.dirname(fullPath);
            const dirUri = vscode.Uri.file(dirPath);
            await vscode.workspace.fs.createDirectory(dirUri);
            const contentBuffer = new TextEncoder().encode(content);
            await vscode.workspace.fs.writeFile(fileUri, contentBuffer);
            this.log(`Fichier créé avec succès: ${fullPath}`);
            return {
                status: 'success',
                message: `Fichier créé: ${filePath}`
            };
        } catch (e: any) {
            this.log(`ERREUR lors de la création du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`);
            throw new Error(`Échec de la création du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`);
        }
    }

    async createFiles(files: { path: string, content: string }[]): Promise<any> {
        if (!Array.isArray(files) || files.length === 0) {
            this.log(`ERREUR: files manquant ou vide pour create-files`);
            throw new Error('files doit être un tableau non vide pour create-files.');
        }

        this.log(`Commande "create-files" reçue pour ${files.length} fichiers`);
        const results: any[] = [];
        let hasError = false;

        for (const file of files) {
            if (!file.path || typeof file.path !== 'string' || file.content === undefined) {
                this.log(`ERREUR: path ou content manquant pour le fichier ${file.path || 'inconnu'}`);
                results.push({
                    path: file.path || 'inconnu',
                    status: 'error',
                    message: 'path (chaîne) et content sont requis.'
                });
                hasError = true;
                continue;
            }

            this.log(`Création du fichier: ${file.path}`);
            try {
                const fullPath = path.join(this.workspacePath, file.path);
                const fileUri = vscode.Uri.file(fullPath);
                if (fs.existsSync(fullPath)) {
                    this.log(`ERREUR: Le fichier ${file.path} existe déjà`);
                    results.push({
                        path: file.path,
                        status: 'error',
                        message: `Le fichier ${file.path} existe déjà.`
                    });
                    hasError = true;
                    continue;
                }

                const dirPath = path.dirname(fullPath);
                const dirUri = vscode.Uri.file(dirPath);
                await vscode.workspace.fs.createDirectory(dirUri);
                const contentBuffer = new TextEncoder().encode(file.content);
                await vscode.workspace.fs.writeFile(fileUri, contentBuffer);
                this.log(`Fichier créé avec succès: ${fullPath}`);
                results.push({
                    path: file.path,
                    status: 'success',
                    message: `Fichier créé: ${file.path}`
                });
            } catch (e: any) {
                this.log(`ERREUR lors de la création du fichier ${file.path}: ${e.message || 'Erreur inconnue'}`);
                results.push({
                    path: file.path,
                    status: 'error',
                    message: `Échec de la création du fichier ${file.path}: ${e.message || 'Erreur inconnue'}`
                });
                hasError = true;
            }
        }

        return {
            status: hasError ? 'error' : 'success',
            results
        };
    }

    async updateFiles(files: { path: string, content: string }[]): Promise<any> {
        if (!Array.isArray(files) || files.length === 0) {
            this.log(`ERREUR: files manquant ou vide pour update-files`);
            throw new Error('files doit être un tableau non vide pour update-files.');
        }

        this.log(`Commande "update-files" reçue pour ${files.length} fichiers`);
        const results: any[] = [];
        let hasError = false;

        for (const file of files) {
            if (!file.path || typeof file.path !== 'string' || file.content === undefined) {
                this.log(`ERREUR: path ou content manquant pour le fichier ${file.path || 'inconnu'}`);
                results.push({
                    path: file.path || 'inconnu',
                    status: 'error',
                    message: 'path (chaîne) et content sont requis.'
                });
                hasError = true;
                continue;
            }

            this.log(`Mise à jour du fichier: ${file.path}`);
            try {
                const fullPath = path.join(this.workspacePath, file.path);
                const fileUri = vscode.Uri.file(fullPath);
                const dirPath = path.dirname(fullPath);
                const dirUri = vscode.Uri.file(dirPath);
                await vscode.workspace.fs.createDirectory(dirUri);
                const contentBuffer = new TextEncoder().encode(file.content);
                await vscode.workspace.fs.writeFile(fileUri, contentBuffer);
                this.log(`Fichier mis à jour avec succès: ${fullPath}`);
                results.push({
                    path: file.path,
                    status: 'success',
                    message: `Fichier mis à jour: ${file.path}`
                });
            } catch (e: any) {
                this.log(`ERREUR lors de la mise à jour du fichier ${file.path}: ${e.message || 'Erreur inconnue'}`);
                results.push({
                    path: file.path,
                    status: 'error',
                    message: `Échec de la mise à jour du fichier ${file.path}: ${e.message || 'Erreur inconnue'}`
                });
                hasError = true;
            }
        }

        return {
            status: hasError ? 'error' : 'success',
            results
        };
    }

    async deleteFiles(dirPath: string, extensions: string[], paths: string[]): Promise<any> {
        const normalizedExtensions = Array.isArray(extensions) ? extensions.map((ext: string) => ext.toLowerCase().startsWith('.') ? ext : `.${ext}`) : [];
        const normalizedPaths = Array.isArray(paths) ? paths : [];
        this.log(`Commande "delete-files" reçue pour le dossier: ${dirPath || 'racine'} avec extensions: ${normalizedExtensions.length ? normalizedExtensions.join(', ') : 'toutes'}, paths: ${normalizedPaths.length ? normalizedPaths.join(', ') : 'aucun'}`);

        const results: any[] = [];
        let hasError = false;

        if (normalizedPaths.length > 0) {
            for (const filePath of normalizedPaths) {
                if (typeof filePath !== 'string') {
                    this.log(`ERREUR: path invalide pour delete-files: ${filePath}`);
                    results.push({
                        path: filePath || 'inconnu',
                        status: 'error',
                        message: 'path doit être une chaîne.'
                    });
                    hasError = true;
                    continue;
                }

                this.log(`Suppression du fichier: ${filePath}`);
                try {
                    const fullPath = path.join(this.workspacePath, filePath);
                    const fileUri = vscode.Uri.file(fullPath);
                    await vscode.workspace.fs.delete(fileUri, { useTrash: false });
                    this.log(`Fichier supprimé avec succès: ${fullPath}`);
                    results.push({
                        path: filePath,
                        status: 'success',
                        message: `Fichier supprimé: ${filePath}`
                    });
                } catch (e: any) {
                    this.log(`ERREUR lors de la suppression du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`);
                    results.push({
                        path: filePath,
                        status: 'error',
                        message: `Échec de la suppression du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`
                    });
                    hasError = true;
                }
            }
        } else if (dirPath) {
            try {
                const fullDirPath = path.join(this.workspacePath, dirPath);
                const dirUri = vscode.Uri.file(fullDirPath);
                const files = await vscode.workspace.fs.readDirectory(dirUri);

                for (const [fileName, fileType] of files) {
                    const relativePath = path.join(dirPath, fileName).replace(/\\/g, '/');
                    const fullPath = path.join(fullDirPath, fileName);
                    const fileExtension = path.extname(fileName).toLowerCase();

                    if (fileType !== vscode.FileType.File || (normalizedExtensions.length > 0 && !normalizedExtensions.includes(fileExtension))) {
                        continue;
                    }

                    this.log(`Suppression du fichier: ${relativePath}`);
                    try {
                        const fileUri = vscode.Uri.file(fullPath);
                        await vscode.workspace.fs.delete(fileUri, { useTrash: false });
                        this.log(`Fichier supprimé avec succès: ${fullPath}`);
                        results.push({
                            path: relativePath,
                            status: 'success',
                            message: `Fichier supprimé: ${relativePath}`
                        });
                    } catch (e: any) {
                        this.log(`ERREUR lors de la suppression du fichier ${relativePath}: ${e.message || 'Erreur inconnue'}`);
                        results.push({
                            path: relativePath,
                            status: 'error',
                            message: `Échec de la suppression du fichier ${relativePath}: ${e.message || 'Erreur inconnue'}`
                        });
                        hasError = true;
                    }
                }
            } catch (e: any) {
                this.log(`ERREUR lors de la liste des fichiers pour ${dirPath || 'racine'}: ${e.message || 'Erreur inconnue'}`);
                results.push({
                    path: dirPath || 'racine',
                    status: 'error',
                    message: `Échec de la liste des fichiers: ${e.message || 'Erreur inconnue'}`
                });
                hasError = true;
            }
        } else {
            this.log(`ERREUR: dirPath ou paths requis pour delete-files`);
            throw new Error('dirPath ou paths est requis pour delete-files.');
        }

        return {
            status: hasError ? 'error' : 'success',
            results
        };
    }

    async patchFiles(files: { path: string, patch: { type: string, value: any } }[]): Promise<any> {
        if (!Array.isArray(files) || files.length === 0) {
            this.log(`ERREUR: files manquant ou vide pour patch-files`);
            throw new Error('files doit être un tableau non vide pour patch-files.');
        }

        this.log(`Commande "patch-files" reçue pour ${files.length} fichiers`);
        const results: any[] = [];
        let hasError = false;

        for (const file of files) {
            if (!file.path || typeof file.path !== 'string' || !file.patch || !file.patch.type || file.patch.value === undefined) {
                this.log(`ERREUR: path, patch.type ou patch.value manquant pour le fichier ${file.path || 'inconnu'}`);
                results.push({
                    path: file.path || 'inconnu',
                    status: 'error',
                    message: 'path (chaîne), patch.type et patch.value sont requis.'
                });
                hasError = true;
                continue;
            }

            this.log(`Application du patch au fichier: ${file.path}`);
            try {
                const fullPath = path.join(this.workspacePath, file.path);
                const fileUri = vscode.Uri.file(fullPath);
                const contentBuffer = await vscode.workspace.fs.readFile(fileUri);
                let newContent: string;

                if (file.patch.type === 'text') {
                    let content = new TextDecoder().decode(contentBuffer);
                    newContent = content.replace(new RegExp(file.patch.value.search, 'g'), file.patch.value.replace);
                } else if (file.patch.type === 'json') {
                    const content = JSON.parse(new TextDecoder().decode(contentBuffer));
                    newContent = JSON.stringify(jsonpatch.apply(content, file.patch.value), null, 2);
                } else {
                    throw new Error(`Type de patch non supporté: ${file.patch.type}`);
                }

                const newContentBuffer = new TextEncoder().encode(newContent);
                await vscode.workspace.fs.writeFile(fileUri, newContentBuffer);
                this.log(`Fichier patché avec succès: ${fullPath}`);
                results.push({
                    path: file.path,
                    status: 'success',
                    message: `Fichier patché: ${file.path}`
                });
            } catch (e: any) {
                this.log(`ERREUR lors du patch du fichier ${file.path}: ${e.message || 'Erreur inconnue'}`);
                results.push({
                    path: file.path,
                    status: 'error',
                    message: `Échec du patch du fichier ${file.path}: ${e.message || 'Erreur inconnue'}`
                });
                hasError = true;
            }
        }

        return {
            status: hasError ? 'error' : 'success',
            results
        };
    }

    async copyFiles(sourceDir: string, destDir: string, extensions: string[]): Promise<any> {
        if (!sourceDir || typeof sourceDir !== 'string' || !destDir || typeof destDir !== 'string') {
            this.log(`ERREUR: sourceDir ou destDir manquant pour copy-files`);
            throw new Error('sourceDir et destDir (chaînes) sont requis pour copy-files.');
        }

        const normalizedExtensions = Array.isArray(extensions) ? extensions.map((ext: string) => ext.toLowerCase().startsWith('.') ? ext : `.${ext}`) : [];
        this.log(`Commande "copy-files" reçue de ${sourceDir} vers ${destDir} avec extensions: ${normalizedExtensions.length ? normalizedExtensions.join(', ') : 'toutes'}`);
        const results: any[] = [];
        let hasError = false;

        try {
            const fullSourceDir = path.join(this.workspacePath, sourceDir);
            const fullDestDir = path.join(this.workspacePath, destDir);
            const sourceDirUri = vscode.Uri.file(fullSourceDir);
            const destDirUri = vscode.Uri.file(fullDestDir);
            await vscode.workspace.fs.createDirectory(destDirUri);

            const files = await vscode.workspace.fs.readDirectory(sourceDirUri);
            for (const [fileName, fileType] of files) {
                const sourcePath = path.join(sourceDir, fileName).replace(/\\/g, '/');
                const destPath = path.join(destDir, fileName).replace(/\\/g, '/');
                const fullSourcePath = path.join(fullSourceDir, fileName);
                const fullDestPath = path.join(fullDestDir, fileName);
                const fileExtension = path.extname(fileName).toLowerCase();

                if (fileType !== vscode.FileType.File || (normalizedExtensions.length > 0 && !normalizedExtensions.includes(fileExtension))) {
                    continue;
                }

                this.log(`Copie du fichier: ${sourcePath} vers ${destPath}`);
                try {
                    const contentBuffer = await vscode.workspace.fs.readFile(vscode.Uri.file(fullSourcePath));
                    await vscode.workspace.fs.writeFile(vscode.Uri.file(fullDestPath), contentBuffer);
                    this.log(`Fichier copié avec succès: ${fullSourcePath} vers ${fullDestPath}`);
                    results.push({
                        sourcePath,
                        destPath,
                        status: 'success',
                        message: `Fichier copié: ${sourcePath} vers ${destPath}`
                    });
                } catch (e: any) {
                    this.log(`ERREUR lors de la copie du fichier ${sourcePath}: ${e.message || 'Erreur inconnue'}`);
                    results.push({
                        sourcePath,
                        destPath,
                        status: 'error',
                        message: `Échec de la copie du fichier ${sourcePath}: ${e.message || 'Erreur inconnue'}`
                    });
                    hasError = true;
                }
            }

            return {
                status: hasError ? 'error' : 'success',
                results
            };
        } catch (e: any) {
            this.log(`ERREUR lors de la liste des fichiers pour ${sourceDir}: ${e.message || 'Erreur inconnue'}`);
            throw new Error(`Échec de la liste des fichiers: ${e.message || 'Erreur inconnue'}`);
        }
    }

    async moveFiles(sourceDir: string, destDir: string, extensions: string[]): Promise<any> {
        if (!sourceDir || typeof sourceDir !== 'string' || !destDir || typeof destDir !== 'string') {
            this.log(`ERREUR: sourceDir ou destDir manquant pour move-files`);
            throw new Error('sourceDir et destDir (chaînes) sont requis pour move-files.');
        }

        const normalizedExtensions = Array.isArray(extensions) ? extensions.map((ext: string) => ext.toLowerCase().startsWith('.') ? ext : `.${ext}`) : [];
        this.log(`Commande "move-files" reçue de ${sourceDir} vers ${destDir} avec extensions: ${normalizedExtensions.length ? normalizedExtensions.join(', ') : 'toutes'}`);
        const results: any[] = [];
        let hasError = false;

        try {
            const fullSourceDir = path.join(this.workspacePath, sourceDir);
            const fullDestDir = path.join(this.workspacePath, destDir);
            const sourceDirUri = vscode.Uri.file(fullSourceDir);
            const destDirUri = vscode.Uri.file(fullDestDir);
            await vscode.workspace.fs.createDirectory(destDirUri);

            const files = await vscode.workspace.fs.readDirectory(sourceDirUri);
            for (const [fileName, fileType] of files) {
                const sourcePath = path.join(sourceDir, fileName).replace(/\\/g, '/');
                const destPath = path.join(destDir, fileName).replace(/\\/g, '/');
                const fullSourcePath = path.join(fullSourceDir, fileName);
                const fullDestPath = path.join(fullDestDir, fileName);
                const fileExtension = path.extname(fileName).toLowerCase();

                if (fileType !== vscode.FileType.File || (normalizedExtensions.length > 0 && !normalizedExtensions.includes(fileExtension))) {
                    continue;
                }

                this.log(`Déplacement du fichier: ${sourcePath} vers ${destPath}`);
                try {
                    const contentBuffer = await vscode.workspace.fs.readFile(vscode.Uri.file(fullSourcePath));
                    await vscode.workspace.fs.writeFile(vscode.Uri.file(fullDestPath), contentBuffer);
                    await vscode.workspace.fs.delete(vscode.Uri.file(fullSourcePath), { useTrash: false });
                    this.log(`Fichier déplacé avec succès: ${fullSourcePath} vers ${fullDestPath}`);
                    results.push({
                        sourcePath,
                        destPath,
                        status: 'success',
                        message: `Fichier déplacé: ${sourcePath} vers ${destPath}`
                    });
                } catch (e: any) {
                    this.log(`ERREUR lors du déplacement du fichier ${sourcePath}: ${e.message || 'Erreur inconnue'}`);
                    results.push({
                        sourcePath,
                        destPath,
                        status: 'error',
                        message: `Échec du déplacement du fichier ${sourcePath}: ${e.message || 'Erreur inconnue'}`
                    });
                    hasError = true;
                }
            }

            return {
                status: hasError ? 'error' : 'success',
                results
            };
        } catch (e: any) {
            this.log(`ERREUR lors de la liste des fichiers pour ${sourceDir}: ${e.message || 'Erreur inconnue'}`);
            throw new Error(`Échec de la liste des fichiers: ${e.message || 'Erreur inconnue'}`);
        }
    }

    async renameFiles(dirPath: string, extensions: string[], renamePattern: { search: string, replace: string }): Promise<any> {
        if (!dirPath || typeof dirPath !== 'string' || !renamePattern || !renamePattern.search || renamePattern.replace === undefined) {
            this.log(`ERREUR: dirPath ou renamePattern manquant pour rename-files`);
            throw new Error('dirPath (chaîne) et renamePattern (search, replace) sont requis pour rename-files.');
        }

        const normalizedExtensions = Array.isArray(extensions) ? extensions.map((ext: string) => ext.toLowerCase().startsWith('.') ? ext : `.${ext}`) : [];
        this.log(`Commande "rename-files" reçue pour le dossier: ${dirPath} avec extensions: ${normalizedExtensions.length ? normalizedExtensions.join(', ') : 'toutes'}`);
        const results: any[] = [];
        let hasError = false;

        try {
            const fullDirPath = path.join(this.workspacePath, dirPath);
            const dirUri = vscode.Uri.file(fullDirPath);
            const files = await vscode.workspace.fs.readDirectory(dirUri);

            for (const [fileName, fileType] of files) {
                const oldPath = path.join(dirPath, fileName).replace(/\\/g, '/');
                const fileExtension = path.extname(fileName).toLowerCase();

                if (fileType !== vscode.FileType.File || (normalizedExtensions.length > 0 && !normalizedExtensions.includes(fileExtension))) {
                    continue;
                }

                const newFileName = fileName.replace(new RegExp(renamePattern.search), renamePattern.replace);
                const newPath = path.join(dirPath, newFileName).replace(/\\/g, '/');
                const fullOldPath = path.join(fullDirPath, fileName);
                const fullNewPath = path.join(fullDirPath, newFileName);

                this.log(`Renommage du fichier: ${oldPath} vers ${newPath}`);
                try {
                    await vscode.workspace.fs.rename(
                        vscode.Uri.file(fullOldPath),
                        vscode.Uri.file(fullNewPath),
                        { overwrite: false }
                    );
                    this.log(`Fichier renommé avec succès: ${fullOldPath} vers ${fullNewPath}`);
                    results.push({
                        oldPath,
                        newPath,
                        status: 'success',
                        message: `Fichier renommé: ${oldPath} vers ${newPath}`
                    });
                } catch (e: any) {
                    this.log(`ERREUR lors du renommage du fichier ${oldPath}: ${e.message || 'Erreur inconnue'}`);
                    results.push({
                        oldPath,
                        newPath,
                        status: 'error',
                        message: `Échec du renommage du fichier ${oldPath}: ${e.message || 'Erreur inconnue'}`
                    });
                    hasError = true;
                }
            }

            return {
                status: hasError ? 'error' : 'success',
                results
            };
        } catch (e: any) {
            this.log(`ERREUR lors de la liste des fichiers pour ${dirPath}: ${e.message || 'Erreur inconnue'}`);
            throw new Error(`Échec de la liste des fichiers: ${e.message || 'Erreur inconnue'}`);
        }
    }
}