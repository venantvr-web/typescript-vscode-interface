import * as vscode from 'vscode';
import { WebSocketServer, WebSocket } from 'ws';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as jsonpatch from 'json-patch';
import * as http from 'http';

// Fonction utilitaire pour déséchapper les chaînes JSON
function unescapeString(str: string): string {
    if (str.startsWith('"') && str.endsWith('"')) {
        str = str.slice(1, -1);
    }
    return str.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('TypeScript VSCode Interface Logs');
    const log = (message: string) => {
        const timestamp = new Date().toISOString();
        outputChannel.appendLine(`[${timestamp}] ${message}`);
    };

    const config = vscode.workspace.getConfiguration('typescriptVscodeInterface');
    const port = config.get<number>('port', 3000);
    const taskName = config.get<string>('taskName', 'run-tests');
    const testDir = config.get<string>('testDir', 'tests');

    log('Extension TypeScript VSCode Interface activée.');

    log('Démarrage de l\'extension TypeScript VSCode Interface...');
    log(`Configuration: port=${port}, taskName=${taskName}, testDir=${testDir}`);

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        log('ERREUR: Aucun dossier de projet ouvert.');
        vscode.window.showErrorMessage('Aucun dossier de projet ouvert.');
        return;
    }

    const workspacePath = workspaceFolder.uri.fsPath;
    log(`Dossier du projet détecté: ${workspacePath}`);

    log(`Initialisation du serveur WebSocket sur le port ${port}...`);
    let wss: WebSocketServer;
    try {
        wss = new WebSocketServer({ port });
        log('Serveur WebSocket démarré avec succès.');
        vscode.window.showInformationMessage(`Serveur WebSocket démarré sur le port ${port}.`);
    } catch (e: any) {
        log(`ERREUR lors du démarrage du serveur WebSocket: ${e.message || 'Erreur inconnue'}`);
        vscode.window.showErrorMessage(`Erreur du serveur WebSocket: ${e.message || 'Erreur inconnue'}`);
        return;
    }

    wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
        const clientAddress = req.socket.remoteAddress;
        log(`Nouvelle connexion WebSocket depuis ${clientAddress}`);

        ws.on('message', async (message: Buffer) => {
            let request: any;
            try {
                request = JSON.parse(message.toString());
                log(`Message JSON reçu: ${JSON.stringify(request)}`);
            } catch (e) {
                log(`ERREUR: Message non-JSON reçu: ${message}`);
                ws.send(JSON.stringify({
                    requestId: null,
                    status: 'error',
                    message: 'Message invalide, JSON attendu.'
                }));
                return;
            }

            const requestId = request.requestId;
            const command = request.command;

            if (!requestId) {
                log(`ERREUR: requestId manquant dans la requête: ${JSON.stringify(request)}`);
                ws.send(JSON.stringify({
                    requestId: null,
                    status: 'error',
                    message: 'requestId est requis.'
                }));
                return;
            }

            if (command === 'run-tests') {
                const outputFile = request.outputFile;
                log(`Commande "run-tests" reçue (requestId: ${requestId})`);
                try {
                    const execAsync = promisify(exec);
                    log(`Exécution de la commande CLI: code --folder-uri file://${workspacePath} --run-task ${taskName}`);
                    const { stdout, stderr } = await execAsync(
                        `code --folder-uri file://${workspacePath} --run-task ${taskName}`
                    );

                    log('Commande exécutée avec succès.');
                    log(`Sortie standard (stdout):\n${stdout}`);
                    if (stderr) {
                        log(`Sortie d\'erreur (stderr):\n${stderr}`);
                    } else {
                        log('Aucune erreur stderr détectée.');
                    }

                    const response = { requestId, status: 'success', stdout, stderr };
                    log(`Réponse JSON à envoyer: ${JSON.stringify(response)}`);

                    if (outputFile) {
                        try {
                            const filePath = path.join(workspacePath, outputFile);
                            const fileUri = vscode.Uri.file(filePath);
                            const content = new TextEncoder().encode(JSON.stringify(response, null, 2));
                            await vscode.workspace.fs.writeFile(fileUri, content);
                            log(`Résultats écrits dans le fichier: ${filePath}`);
                        } catch (e: any) {
                            log(`ERREUR lors de l\'écriture du fichier ${outputFile}: ${e.message || 'Erreur inconnue'}`);
                            ws.send(JSON.stringify({
                                requestId,
                                status: 'error',
                                message: `Échec de l'écriture du fichier ${outputFile}: ${e.message || 'Erreur inconnue'}`,
                                stderr: stderr || ''
                            }));
                            return;
                        }
                    }

                    ws.send(JSON.stringify(response));
                    log(`Résultats envoyés au client WebSocket (requestId: ${requestId}).`);
                } catch (error: any) {
                    log(`ERREUR lors de l\'exécution de la commande (requestId: ${requestId}): ${error.message || 'Erreur inconnue'}`);
                    if (error.stderr) {
                        log(`Détails de l\'erreur (stderr):\n${error.stderr}`);
                    }
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'error',
                        message: error.message || 'Erreur inconnue',
                        stderr: error.stderr || ''
                    }));
                    log(`Erreur envoyée au client WebSocket (requestId: ${requestId}).`);
                }
            } else if (command === 'create-file') {
                const filePath = request.filePath;
                const content = request.content;
                if (!filePath || content === undefined) {
                    log(`ERREUR: filePath ou content manquant pour create-file (requestId: ${requestId})`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'error',
                        message: 'filePath et content sont requis pour create-file.'
                    }));
                    return;
                }

                log(`Commande "create-file" reçue pour le fichier: ${filePath} (requestId: ${requestId})`);
                try {
                    const fullPath = path.join(workspacePath, filePath);
                    const fileUri = vscode.Uri.file(fullPath);
                    if (fs.existsSync(fullPath)) {
                        log(`ERREUR: Le fichier ${filePath} existe déjà (requestId: ${requestId})`);
                        ws.send(JSON.stringify({
                            requestId,
                            status: 'error',
                            message: `Le fichier ${filePath} existe déjà.`
                        }));
                        return;
                    }

                    const dirPath = path.dirname(fullPath);
                    const dirUri = vscode.Uri.file(dirPath);
                    await vscode.workspace.fs.createDirectory(dirUri);
                    const contentUnescaped = unescapeString(content);
                    const contentBuffer = new TextEncoder().encode(contentUnescaped);
                    await vscode.workspace.fs.writeFile(fileUri, contentBuffer);
                    log(`Fichier créé avec succès: ${fullPath}`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'success',
                        message: `Fichier créé: ${filePath}`
                    }));
                } catch (e: any) {
                    log(`ERREUR lors de la création du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'error',
                        message: `Échec de la création du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`
                    }));
                }
            } else if (command === 'get-file') {
                const filePath = request.filePath;
                if (!filePath) {
                    log(`ERREUR: filePath manquant pour get-file (requestId: ${requestId})`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'error',
                        message: 'filePath est requis pour get-file.'
                    }));
                    return;
                }

                log(`Commande "get-file" reçue pour le fichier: ${filePath} (requestId: ${requestId})`);
                try {
                    const fullPath = path.join(workspacePath, filePath);
                    const fileUri = vscode.Uri.file(fullPath);
                    const contentBuffer = await vscode.workspace.fs.readFile(fileUri);
                    const content = new TextDecoder().decode(contentBuffer);
                    log(`Fichier lu avec succès: ${fullPath}`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'success',
                        filePath,
                        content
                    }));
                } catch (e: any) {
                    log(`ERREUR lors de la lecture du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'error',
                        message: `Échec de la lecture du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`
                    }));
                }
            } else if (command === 'list-files') {
                const dirPath = request.dirPath || '';
                const extensions = Array.isArray(request.extensions) ? request.extensions.map((ext: string) => ext.toLowerCase().startsWith('.') ? ext : `.${ext}`) : [];
                log(`Commande "list-files" reçue pour le dossier: ${dirPath || 'racine'} avec extensions: ${extensions.length ? extensions.join(', ') : 'toutes'} (requestId: ${requestId})`);
                try {
                    const fullDirPath = path.join(workspacePath, dirPath);
                    const dirUri = vscode.Uri.file(fullDirPath);
                    const files = await vscode.workspace.fs.readDirectory(dirUri);
                    const fileList: any[] = [];

                    for (const [fileName, fileType] of files) {
                        const relativePath = path.join(dirPath, fileName).replace(/\\/g, '/');
                        const fullPath = path.join(fullDirPath, fileName);
                        const fileExtension = path.extname(fileName).toLowerCase();

                        if (extensions.length > 0 && fileType === vscode.FileType.File && !extensions.includes(fileExtension)) {
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
                                log(`ERREUR lors de la lecture du fichier ${relativePath}: ${e.message || 'Erreur inconnue'}`);
                                fileInfo.type = 'error';
                                fileInfo.content = null;
                                fileInfo.error = e.message || 'Erreur inconnue';
                            }
                        }

                        fileList.push(fileInfo);
                    }

                    log(`Liste des fichiers générée: ${fileList.length} éléments`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'success',
                        files: fileList
                    }));
                } catch (e: any) {
                    log(`ERREUR lors de la liste des fichiers pour ${dirPath || 'racine'}: ${e.message || 'Erreur inconnue'}`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'error',
                        message: `Échec de la liste des fichiers: ${e.message || 'Erreur inconnue'}`
                    }));
                }
            } else if (command === 'create-files') {
                const files: any[] = request.files;
                if (!Array.isArray(files) || files.length === 0) {
                    log(`ERREUR: files manquant ou vide pour create-files (requestId: ${requestId})`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'error',
                        message: 'files doit être un tableau non vide pour create-files.'
                    }));
                    return;
                }

                log(`Commande "create-files" reçue pour ${files.length} fichiers (requestId: ${requestId})`);
                const results: any[] = [];
                let hasError = false;

                for (const file of files) {
                    const filePath: string = file.path;
                    const content: any = file.content;

                    if (!filePath || content === undefined) {
                        log(`ERREUR: path ou content manquant pour le fichier ${filePath || 'inconnu'} (requestId: ${requestId})`);
                        results.push({
                            path: filePath || 'inconnu',
                            status: 'error',
                            message: 'path et content sont requis.'
                        });
                        hasError = true;
                        continue;
                    }

                    log(`Création du fichier: ${filePath} (requestId: ${requestId})`);
                    try {
                        const fullPath = path.join(workspacePath, filePath);
                        const fileUri = vscode.Uri.file(fullPath);
                        if (fs.existsSync(fullPath)) {
                            log(`ERREUR: Le fichier ${filePath} existe déjà (requestId: ${requestId})`);
                            results.push({
                                path: filePath,
                                status: 'error',
                                message: `Le fichier ${filePath} existe déjà.`
                            });
                            hasError = true;
                            continue;
                        }

                        const dirPath = path.dirname(fullPath);
                        const dirUri = vscode.Uri.file(dirPath);
                        await vscode.workspace.fs.createDirectory(dirUri);
                        const contentUnescaped = unescapeString(content);
                        const contentBuffer = new TextEncoder().encode(contentUnescaped);
                        await vscode.workspace.fs.writeFile(fileUri, contentBuffer);
                        log(`Fichier créé avec succès: ${fullPath}`);
                        results.push({
                            path: filePath,
                            status: 'success',
                            message: `Fichier créé: ${filePath}`
                        });
                    } catch (e: any) {
                        log(`ERREUR lors de la création du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`);
                        results.push({
                            path: filePath,
                            status: 'error',
                            message: `Échec de la création du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`
                        });
                        hasError = true;
                    }
                }

                ws.send(JSON.stringify({
                    requestId,
                    status: hasError ? 'error' : 'success',
                    results
                }));
                log(`Résultats envoyés pour create-files (requestId: ${requestId}, ${results.length} fichiers traités)`);
            } else if (command === 'update-files') {
                const files: any[] = request.files;
                if (!Array.isArray(files) || files.length === 0) {
                    log(`ERREUR: files manquant ou vide pour update-files (requestId: ${requestId})`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'error',
                        message: 'files doit être un tableau non vide pour update-files.'
                    }));
                    return;
                }

                log(`Commande "update-files" reçue pour ${files.length} fichiers (requestId: ${requestId})`);
                const results: any[] = [];
                let hasError = false;

                for (const file of files) {
                    const filePath: string = file.path;
                    const content: any = file.content;

                    if (!filePath || content === undefined) {
                        log(`ERREUR: path ou content manquant pour le fichier ${filePath || 'inconnu'} (requestId: ${requestId})`);
                        results.push({
                            path: filePath || 'inconnu',
                            status: 'error',
                            message: 'path et content sont requis.'
                        });
                        hasError = true;
                        continue;
                    }

                    log(`Mise à jour du fichier: ${filePath} (requestId: ${requestId})`);
                    try {
                        const fullPath = path.join(workspacePath, filePath);
                        const fileUri = vscode.Uri.file(fullPath);
                        const dirPath = path.dirname(fullPath);
                        const dirUri = vscode.Uri.file(dirPath);
                        await vscode.workspace.fs.createDirectory(dirUri);
                        const contentUnescaped = unescapeString(content);
                        const contentBuffer = new TextEncoder().encode(contentUnescaped);
                        await vscode.workspace.fs.writeFile(fileUri, contentBuffer);
                        log(`Fichier mis à jour avec succès: ${fullPath}`);
                        results.push({
                            path: filePath,
                            status: 'success',
                            message: `Fichier mis à jour: ${filePath}`
                        });
                    } catch (e: any) {
                        log(`ERREUR lors de la mise à jour du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`);
                        results.push({
                            path: filePath,
                            status: 'error',
                            message: `Échec de la mise à jour du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`
                        });
                        hasError = true;
                    }
                }

                ws.send(JSON.stringify({
                    requestId,
                    status: hasError ? 'error' : 'success',
                    results
                }));
                log(`Résultats envoyés pour update-files (requestId: ${requestId}, ${results.length} fichiers traités)`);
            } else if (command === 'delete-files') {
                const dirPath = request.dirPath || '';
                const extensions = Array.isArray(request.extensions) ? request.extensions.map((ext: string) => ext.toLowerCase().startsWith('.') ? ext : `.${ext}`) : [];
                const paths: string[] = Array.isArray(request.paths) ? request.paths : [];
                log(`Commande "delete-files" reçue pour le dossier: ${dirPath || 'racine'} avec extensions: ${extensions.length ? extensions.join(', ') : 'toutes'}, paths: ${paths.length ? paths.join(', ') : 'aucun'} (requestId: ${requestId})`);

                const results: any[] = [];
                let hasError = false;

                if (paths.length > 0) {
                    for (const filePath of paths) {
                        log(`Suppression du fichier: ${filePath} (requestId: ${requestId})`);
                        try {
                            const fullPath = path.join(workspacePath, filePath);
                            const fileUri = vscode.Uri.file(fullPath);
                            await vscode.workspace.fs.delete(fileUri, { useTrash: false });
                            log(`Fichier supprimé avec succès: ${fullPath}`);
                            results.push({
                                path: filePath,
                                status: 'success',
                                message: `Fichier supprimé: ${filePath}`
                            });
                        } catch (e: any) {
                            log(`ERREUR lors de la suppression du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`);
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
                        const fullDirPath = path.join(workspacePath, dirPath);
                        const dirUri = vscode.Uri.file(fullDirPath);
                        const files = await vscode.workspace.fs.readDirectory(dirUri);

                        for (const [fileName, fileType] of files) {
                            const relativePath = path.join(dirPath, fileName).replace(/\\/g, '/');
                            const fullPath = path.join(fullDirPath, fileName);
                            const fileExtension = path.extname(fileName).toLowerCase();

                            if (fileType !== vscode.FileType.File || (extensions.length > 0 && !extensions.includes(fileExtension))) {
                                continue;
                            }

                            log(`Suppression du fichier: ${relativePath} (requestId: ${requestId})`);
                            try {
                                const fileUri = vscode.Uri.file(fullPath);
                                await vscode.workspace.fs.delete(fileUri, { useTrash: false });
                                log(`Fichier supprimé avec succès: ${fullPath}`);
                                results.push({
                                    path: relativePath,
                                    status: 'success',
                                    message: `Fichier supprimé: ${relativePath}`
                                });
                            } catch (e: any) {
                                log(`ERREUR lors de la suppression du fichier ${relativePath}: ${e.message || 'Erreur inconnue'}`);
                                results.push({
                                    path: relativePath,
                                    status: 'error',
                                    message: `Échec de la suppression du fichier ${relativePath}: ${e.message || 'Erreur inconnue'}`
                                });
                                hasError = true;
                            }
                        }
                    } catch (e: any) {
                        log(`ERREUR lors de la liste des fichiers pour ${dirPath || 'racine'}: ${e.message || 'Erreur inconnue'}`);
                        results.push({
                            path: dirPath || 'racine',
                            status: 'error',
                            message: `Échec de la liste des fichiers: ${e.message || 'Erreur inconnue'}`
                        });
                        hasError = true;
                    }
                } else {
                    log(`ERREUR: dirPath ou paths requis pour delete-files (requestId: ${requestId})`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'error',
                        message: 'dirPath ou paths est requis pour delete-files.'
                    }));
                    return;
                }

                ws.send(JSON.stringify({
                    requestId,
                    status: hasError ? 'error' : 'success',
                    results
                }));
                log(`Résultats envoyés pour delete-files (requestId: ${requestId}, ${results.length} fichiers traités)`);
            } else if (command === 'patch-files') {
                const files: any[] = request.files;
                if (!Array.isArray(files) || files.length === 0) {
                    log(`ERREUR: files manquant ou vide pour patch-files (requestId: ${requestId})`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'error',
                        message: 'files doit être un tableau non vide pour patch-files.'
                    }));
                    return;
                }

                log(`Commande "patch-files" reçue pour ${files.length} fichiers (requestId: ${requestId})`);
                const results: any[] = [];
                let hasError = false;

                for (const file of files) {
                    const filePath: string = file.path;
                    const patch: any = file.patch;

                    if (!filePath || !patch || !patch.type || patch.value === undefined) {
                        log(`ERREUR: path, patch.type ou patch.value manquant pour le fichier ${filePath || 'inconnu'} (requestId: ${requestId})`);
                        results.push({
                            path: filePath || 'inconnu',
                            status: 'error',
                            message: 'path, patch.type et patch.value sont requis.'
                        });
                        hasError = true;
                        continue;
                    }

                    log(`Application du patch au fichier: ${filePath} (requestId: ${requestId})`);
                    try {
                        const fullPath = path.join(workspacePath, filePath);
                        const fileUri = vscode.Uri.file(fullPath);
                        const contentBuffer = await vscode.workspace.fs.readFile(fileUri);
                        let newContent: string;

                        if (patch.type === 'text') {
                            let content = new TextDecoder().decode(contentBuffer);
                            newContent = content.replace(new RegExp(patch.value.search, 'g'), patch.value.replace);
                        } else if (patch.type === 'json') {
                            const content = JSON.parse(new TextDecoder().decode(contentBuffer));
                            newContent = JSON.stringify(jsonpatch.apply(content, patch.value), null, 2);
                        } else {
                            throw new Error(`Type de patch non supporté: ${patch.type}`);
                        }

                        const newContentBuffer = new TextEncoder().encode(newContent);
                        await vscode.workspace.fs.writeFile(fileUri, newContentBuffer);
                        log(`Fichier patché avec succès: ${fullPath}`);
                        results.push({
                            path: filePath,
                            status: 'success',
                            message: `Fichier patché: ${filePath}`
                        });
                    } catch (e: any) {
                        log(`ERREUR lors du patch du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`);
                        results.push({
                            path: filePath,
                            status: 'error',
                            message: `Échec du patch du fichier ${filePath}: ${e.message || 'Erreur inconnue'}`
                        });
                        hasError = true;
                    }
                }

                ws.send(JSON.stringify({
                    requestId,
                    status: hasError ? 'error' : 'success',
                    results
                }));
                log(`Résultats envoyés pour patch-files (requestId: ${requestId}, ${results.length} fichiers traités)`);
            } else if (command === 'copy-files') {
                const sourceDir = request.sourceDir || '';
                const destDir = request.destDir;
                const extensions = Array.isArray(request.extensions) ? request.extensions.map((ext: string) => ext.toLowerCase().startsWith('.') ? ext : `.${ext}`) : [];
                if (!sourceDir || !destDir) {
                    log(`ERREUR: sourceDir ou destDir manquant pour copy-files (requestId: ${requestId})`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'error',
                        message: 'sourceDir et destDir sont requis pour copy-files.'
                    }));
                    return;
                }

                log(`Commande "copy-files" reçue de ${sourceDir} vers ${destDir} avec extensions: ${extensions.length ? extensions.join(', ') : 'toutes'} (requestId: ${requestId})`);
                const results: any[] = [];
                let hasError = false;

                try {
                    const fullSourceDir = path.join(workspacePath, sourceDir);
                    const fullDestDir = path.join(workspacePath, destDir);
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

                        if (fileType !== vscode.FileType.File || (extensions.length > 0 && !extensions.includes(fileExtension))) {
                            continue;
                        }

                        log(`Copie du fichier: ${sourcePath} vers ${destPath} (requestId: ${requestId})`);
                        try {
                            const contentBuffer = await vscode.workspace.fs.readFile(vscode.Uri.file(fullSourcePath));
                            await vscode.workspace.fs.writeFile(vscode.Uri.file(fullDestPath), contentBuffer);
                            log(`Fichier copié avec succès: ${fullSourcePath} vers ${fullDestPath}`);
                            results.push({
                                sourcePath,
                                destPath,
                                status: 'success',
                                message: `Fichier copié: ${sourcePath} vers ${destPath}`
                            });
                        } catch (e: any) {
                            log(`ERREUR lors de la copie du fichier ${sourcePath}: ${e.message || 'Erreur inconnue'}`);
                            results.push({
                                sourcePath,
                                destPath,
                                status: 'error',
                                message: `Échec de la copie du fichier ${sourcePath}: ${e.message || 'Erreur inconnue'}`
                            });
                            hasError = true;
                        }
                    }

                    ws.send(JSON.stringify({
                        requestId,
                        status: hasError ? 'error' : 'success',
                        results
                    }));
                    log(`Résultats envoyés pour copy-files (requestId: ${requestId}, ${results.length} fichiers traités)`);
                } catch (e: any) {
                    log(`ERREUR lors de la liste des fichiers pour ${sourceDir}: ${e.message || 'Erreur inconnue'}`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'error',
                        message: `Échec de la liste des fichiers: ${e.message || 'Erreur inconnue'}`
                    }));
                }
            } else if (command === 'move-files') {
                const sourceDir = request.sourceDir || '';
                const destDir = request.destDir;
                const extensions = Array.isArray(request.extensions) ? request.extensions.map((ext: string) => ext.toLowerCase().startsWith('.') ? ext : `.${ext}`) : [];
                if (!sourceDir || !destDir) {
                    log(`ERREUR: sourceDir ou destDir manquant pour move-files (requestId: ${requestId})`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'error',
                        message: 'sourceDir et destDir sont requis pour move-files.'
                    }));
                    return;
                }

                log(`Commande "move-files" reçue de ${sourceDir} vers ${destDir} avec extensions: ${extensions.length ? extensions.join(', ') : 'toutes'} (requestId: ${requestId})`);
                const results: any[] = [];
                let hasError = false;

                try {
                    const fullSourceDir = path.join(workspacePath, sourceDir);
                    const fullDestDir = path.join(workspacePath, destDir);
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

                        if (fileType !== vscode.FileType.File || (extensions.length > 0 && !extensions.includes(fileExtension))) {
                            continue;
                        }

                        log(`Déplacement du fichier: ${sourcePath} vers ${destPath} (requestId: ${requestId})`);
                        try {
                            const contentBuffer = await vscode.workspace.fs.readFile(vscode.Uri.file(fullSourcePath));
                            await vscode.workspace.fs.writeFile(vscode.Uri.file(fullDestPath), contentBuffer);
                            await vscode.workspace.fs.delete(vscode.Uri.file(fullSourcePath), { useTrash: false });
                            log(`Fichier déplacé avec succès: ${fullSourcePath} vers ${fullDestPath}`);
                            results.push({
                                sourcePath,
                                destPath,
                                status: 'success',
                                message: `Fichier déplacé: ${sourcePath} vers ${destPath}`
                            });
                        } catch (e: any) {
                            log(`ERREUR lors du déplacement du fichier ${sourcePath}: ${e.message || 'Erreur inconnue'}`);
                            results.push({
                                sourcePath,
                                destPath,
                                status: 'error',
                                message: `Échec du déplacement du fichier ${sourcePath}: ${e.message || 'Erreur inconnue'}`
                            });
                            hasError = true;
                        }
                    }

                    ws.send(JSON.stringify({
                        requestId,
                        status: hasError ? 'error' : 'success',
                        results
                    }));
                    log(`Résultats envoyés pour move-files (requestId: ${requestId}, ${results.length} fichiers traités)`);
                } catch (e: any) {
                    log(`ERREUR lors de la liste des fichiers pour ${sourceDir}: ${e.message || 'Erreur inconnue'}`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'error',
                        message: `Échec de la liste des fichiers: ${e.message || 'Erreur inconnue'}`
                    }));
                }
            } else if (command === 'rename-files') {
                const dirPath = request.dirPath || '';
                const extensions = Array.isArray(request.extensions) ? request.extensions.map((ext: string) => ext.toLowerCase().startsWith('.') ? ext : `.${ext}`) : [];
                const renamePattern = request.renamePattern;
                if (!dirPath || !renamePattern || !renamePattern.search || renamePattern.replace === undefined) {
                    log(`ERREUR: dirPath ou renamePattern manquant pour rename-files (requestId: ${requestId})`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'error',
                        message: 'dirPath et renamePattern (search, replace) sont requis pour rename-files.'
                    }));
                    return;
                }

                log(`Commande "rename-files" reçue pour le dossier: ${dirPath} avec extensions: ${extensions.length ? extensions.join(', ') : 'toutes'} (requestId: ${requestId})`);
                const results: any[] = [];
                let hasError = false;

                try {
                    const fullDirPath = path.join(workspacePath, dirPath);
                    const dirUri = vscode.Uri.file(fullDirPath);
                    const files = await vscode.workspace.fs.readDirectory(dirUri);

                    for (const [fileName, fileType] of files) {
                        const oldPath = path.join(dirPath, fileName).replace(/\\/g, '/');
                        const fileExtension = path.extname(fileName).toLowerCase();

                        if (fileType !== vscode.FileType.File || (extensions.length > 0 && !extensions.includes(fileExtension))) {
                            continue;
                        }

                        const newFileName = fileName.replace(new RegExp(renamePattern.search), renamePattern.replace);
                        const newPath = path.join(dirPath, newFileName).replace(/\\/g, '/');
                        const fullOldPath = path.join(fullDirPath, fileName);
                        const fullNewPath = path.join(fullDirPath, newFileName);

                        log(`Renommage du fichier: ${oldPath} vers ${newPath} (requestId: ${requestId})`);
                        try {
                            await vscode.workspace.fs.rename(
                                vscode.Uri.file(fullOldPath),
                                vscode.Uri.file(fullNewPath),
                                { overwrite: false }
                            );
                            log(`Fichier renommé avec succès: ${fullOldPath} vers ${fullNewPath}`);
                            results.push({
                                oldPath,
                                newPath,
                                status: 'success',
                                message: `Fichier renommé: ${oldPath} vers ${newPath}`
                            });
                        } catch (e: any) {
                            log(`ERREUR lors du renommage du fichier ${oldPath}: ${e.message || 'Erreur inconnue'}`);
                            results.push({
                                oldPath,
                                newPath,
                                status: 'error',
                                message: `Échec du renommage du fichier ${oldPath}: ${e.message || 'Erreur inconnue'}`
                            });
                            hasError = true;
                        }
                    }

                    ws.send(JSON.stringify({
                        requestId,
                        status: hasError ? 'error' : 'success',
                        results
                    }));
                    log(`Résultats envoyés pour rename-files (requestId: ${requestId}, ${results.length} fichiers traités)`);
                } catch (e: any) {
                    log(`ERREUR lors de la liste des fichiers pour ${dirPath}: ${e.message || 'Erreur inconnue'}`);
                    ws.send(JSON.stringify({
                        requestId,
                        status: 'error',
                        message: `Échec de la liste des fichiers: ${e.message || 'Erreur inconnue'}`
                    }));
                }
            } else {
                log(`ERREUR: Commande non reconnue: ${command} (requestId: ${requestId})`);
                ws.send(JSON.stringify({
                    requestId,
                    status: 'error',
                    message: 'Commande non reconnue. Utilisez "run-tests", "create-file", "get-file", "list-files", "create-files", "update-files", "delete-files", "patch-files", "copy-files", "move-files" ou "rename-files".'
                }));
                log('Message d\'erreur envoyé au client.');
            }
        });

        ws.on('close', () => {
            log(`Connexion WebSocket fermée pour ${clientAddress}`);
        });

        ws.on('error', (error: Error) => {
            log(`ERREUR WebSocket: ${error.message || 'Erreur inconnue'}`);
        });
    });

    wss.on('error', (error: Error) => {
        log(`ERREUR du serveur WebSocket: ${error.message || 'Erreur inconnue'}`);
        vscode.window.showErrorMessage(`Erreur du serveur WebSocket: ${error.message || 'Erreur inconnue'}`);
    });

    const configureCommand = vscode.commands.registerCommand('typescript-vscode-interface.configure', () => {
        log('Ouverture de la page de configuration...');
        const panel = vscode.window.createWebviewPanel(
            'typescriptVscodeInterfaceConfig',
            'TypeScript VSCode Interface Configuration',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>TypeScript VSCode Interface Configuration</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    label { display: block; margin: 10px 0; }
                    input { width: 200px; padding: 5px; }
                    button { padding: 10px 20px; margin-top: 10px; }
                </style>
            </head>
            <body>
                <h1>TypeScript VSCode Interface Configuration</h1>
                <label>Port WebSocket:
                    <input type="number" id="port" value="${port}">
                </label>
                <label>Nom de la tâche:
                    <input type="text" id="taskName" value="${taskName}">
                </label>
                <label>Dossier des tests:
                    <input type="text" id="testDir" value="${testDir}">
                </label>
                <button onclick="saveConfig()">Sauvegarder</button>
                <script>
                    const vscode = acquireVsCodeApi();
                    function saveConfig() {
                        const port = document.getElementById('port').value;
                        const taskName = document.getElementById('taskName').value;
                        const testDir = document.getElementById('testDir').value;
                        vscode.postMessage({
                            command: 'saveConfig',
                            port: parseInt(port),
                            taskName,
                            testDir
                        });
                    }
                </script>
            </body>
            </html>
        `;

        panel.webview.onDidReceiveMessage(
            async (message: any) => {
                if (message.command === 'saveConfig') {
                    log('Sauvegarde de la configuration...');
                    try {
                        await config.update('port', message.port, vscode.ConfigurationTarget.Workspace);
                        await config.update('taskName', message.taskName, vscode.ConfigurationTarget.Workspace);
                        await config.update('testDir', message.testDir, vscode.ConfigurationTarget.Workspace);
                        log(`Configuration sauvegardée: port=${message.port}, taskName=${message.taskName}, testDir=${message.testDir}`);
                        vscode.window.showInformationMessage('Configuration sauvegardée. Redémarrez VSCode pour appliquer les changements.');
                    } catch (e: any) {
                        log(`ERREUR lors de la sauvegarde de la configuration: ${e.message || 'Erreur inconnue'}`);
                        vscode.window.showErrorMessage(`Erreur lors de la sauvegarde: ${e.message || 'Erreur inconnue'}`);
                    }
                }
            },
            undefined,
            context.subscriptions
        );

        log('Page de configuration ouverte.');
    });

    context.subscriptions.push(configureCommand, {
        dispose: () => {
            log('Arrêt du serveur WebSocket...');
            wss.close();
            log('Serveur WebSocket arrêté.');
            outputChannel.dispose();
            log('Canal de logs fermé.');
        }
    });
}

export function deactivate() { }