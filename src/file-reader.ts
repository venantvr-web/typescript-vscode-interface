import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class FileReader {
    private workspacePath: string;
    private log: (message: string) => void;

    constructor(workspacePath: string, log: (message: string) => void) {
        this.workspacePath = workspacePath;
        this.log = log;
    }

    async getFile(filePath: string): Promise<any> {
        if (!filePath || typeof filePath !== 'string') {
            this.log(`ERREUR: filePath manquant ou invalide pour get-file`);
            throw new Error('filePath (chaîne) est requis pour get-file.');
        }

        this.log(`Commande "get-file" reçue pour le fichier: ${filePath}`);
        try {
            const fullPath = path.join(this.workspacePath, filePath);
            const fileUri = vscode.Uri.file(fullPath);
            const contentBuffer = await vscode.workspace.fs.readFile(fileUri);
            const content = new TextDecoder().decode(contentBuffer);
            this.log(`Fichier lu avec succès: ${fullPath}`);
            return {
                status: 'success',
                filePath,
                content
            };
        } catch (e: any) {
            this.log(`ERREUR lors de la lecture du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`);
            throw new Error(`Échec de la lecture du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`);
        }
    }

    async listFiles(dirPath: string, extensions: string[]): Promise<any> {
        const normalizedExtensions = Array.isArray(extensions) ? extensions.map((ext: string) => ext.toLowerCase().startsWith('.') ? ext : `.${ext}`) : [];
        this.log(`Commande "list-files" reçue pour le dossier: ${dirPath || 'racine'} avec extensions: ${normalizedExtensions.length ? normalizedExtensions.join(', ') : 'toutes'}`);
        try {
            const fullDirPath = path.join(this.workspacePath, dirPath);
            const dirUri = vscode.Uri.file(fullDirPath);
            const files = await vscode.workspace.fs.readDirectory(dirUri);
            const fileList: any[] = [];

            for (const [fileName, fileType] of files) {
                const relativePath = path.join(dirPath, fileName).replace(/\\/g, '/');
                const fullPath = path.join(fullDirPath, fileName);
                const fileExtension = path.extname(fileName).toLowerCase();

                if (normalizedExtensions.length > 0 && fileType === vscode.FileType.File && !normalizedExtensions.includes(fileExtension)) {
                    continue;
                }

                const stats = fs.statSync(fullPath);
                const fileInfo: any = {
                    path: relativePath,
                    type: fileType === vscode.FileType.File ? 'file' : 'directory',
                    size: stats.size,
                    lastModified: stats.mtime.toISOString()
                };

                if (fileType === vscode.FileType.File) {
                    try {
                        const contentBuffer = await vscode.workspace.fs.readFile(vscode.Uri.file(fullPath));
                        const textExtensions = ['.py', '.json', '.txt', '.md', '.yml', '.yaml', '.ini', '.cfg'];
                        if (textExtensions.includes(fileExtension)) {
                            fileInfo.type = 'text';
                            fileInfo.content = new TextDecoder().decode(contentBuffer);
                        } else {
                            fileInfo.type = 'binary';
                            fileInfo.content = null;
                        }
                    } catch (e: any) {
                        this.log(`ERREUR lors de la lecture du fichier ${relativePath}: ${e.message || 'Erreur inconnue'}`);
                        fileInfo.type = 'error';
                        fileInfo.content = null;
                        fileInfo.error = e.message || 'Erreur inconnue';
                    }
                }

                fileList.push(fileInfo);
            }

            this.log(`Liste des fichiers générée: ${fileList.length} éléments`);
            return {
                status: 'success',
                files: fileList
            };
        } catch (e: any) {
            this.log(`ERREUR lors de la liste des fichiers pour ${dirPath || 'racine'}: ${e.message || 'Erreur inconnue'}`);
            throw new Error(`Échec de la liste des fichiers: ${e.message || 'Erreur inconnue'}`);
        }
    }
}