import * as vscode from 'vscode';
import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import { FileReader } from './file-reader';
import { FileWriter } from './file-writer';
import { TaskRunner } from './task-runner';
import { unescapeString } from './utils';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('TypeScript VSCode Interface Logs');
    const log = (message: string) => {
        const timestamp = new Date().toISOString();
        outputChannel.appendLine(`[${timestamp}] ${message}`);
    };

    log('Extension TypeScript VSCode Interface activée.');
    log('Démarrage de l\'extension TypeScript VSCode Interface...');

    const config = vscode.workspace.getConfiguration('typescriptVscodeInterface');
    const port = config.get<number>('port', 3000);
    const taskName = config.get<string>('taskName', 'run-tests');
    const testDir = config.get<string>('testDir', 'tests');
    log(`Configuration: port=${port}, taskName=${taskName}, testDir=${testDir}`);

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        log('ERREUR: Aucun dossier de projet ouvert.');
        vscode.window.showErrorMessage('Aucun dossier de projet ouvert.');
        return;
    }
    const workspacePath = workspaceFolder.uri.fsPath;
    log(`Dossier du projet détecté: ${workspacePath}`);

    const fileReader = new FileReader(workspacePath, log);
    const fileWriter = new FileWriter(workspacePath, log);
    const taskRunner = new TaskRunner(workspacePath, taskName, log);

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

            if (!requestId || typeof requestId !== 'string') {
                log(`ERREUR: requestId manquant ou invalide dans la requête: ${JSON.stringify(request)}`);
                ws.send(JSON.stringify({
                    requestId: null,
                    status: 'error',
                    message: 'requestId est requis et doit être une chaîne.'
                }));
                return;
            }

            try {
                let response: any;
                switch (command) {
                    case 'run-tests':
                        response = await taskRunner.runTests(request.outputFile);
                        break;
                    // case 'git-commit':
                    //     if (!request.message || typeof request.message !== 'string') {
                    //         throw new Error('message (chaîne non vide) est requis pour git-commit.');
                    //     }
                    //     response = await taskRunner.gitCommit(request.message);
                    //     break;
                    // case 'git-push':
                    //     response = await taskRunner.gitPush();
                    //     break;
                    case 'execute-command':
                        if (!request.shellCommand || typeof request.shellCommand !== 'string') {
                            throw new Error('shellCommand (chaîne non vide) est requis pour execute-command.');
                        }
                        response = await taskRunner.executeCommand(request.shellCommand);
                        break;
                    // case 'init-git':
                    //     response = await taskRunner.initGit(request.remoteUrl);
                    //     break;
                    case 'create-file':
                        if (!request.filePath || typeof request.filePath !== 'string' || request.content === undefined) {
                            throw new Error('filePath (chaîne) et content sont requis pour create-file.');
                        }
                        response = await fileWriter.createFile(request.filePath, unescapeString(request.content));
                        break;
                    case 'get-file':
                        if (!request.filePath || typeof request.filePath !== 'string') {
                            throw new Error('filePath (chaîne) est requis pour get-file.');
                        }
                        response = await fileReader.getFile(request.filePath);
                        break;
                    case 'list-files':
                        response = await fileReader.listFiles(request.dirPath || '', request.extensions || []);
                        break;
                    case 'create-files':
                        if (!Array.isArray(request.files) || request.files.length === 0) {
                            throw new Error('files doit être un tableau non vide pour create-files.');
                        }
                        response = await fileWriter.createFiles(request.files.map((f: any) => ({
                            path: f.path,
                            content: unescapeString(f.content)
                        })));
                        break;
                    case 'update-files':
                        if (!Array.isArray(request.files) || request.files.length === 0) {
                            throw new Error('files doit être un tableau non vide pour update-files.');
                        }
                        response = await fileWriter.updateFiles(request.files.map((f: any) => ({
                            path: f.path,
                            content: unescapeString(f.content)
                        })));
                        break;
                    case 'delete-files':
                        response = await fileWriter.deleteFiles(request.dirPath || '', request.extensions || [], request.paths || []);
                        break;
                    case 'patch-files':
                        if (!Array.isArray(request.files) || request.files.length === 0) {
                            throw new Error('files doit être un tableau non vide pour patch-files.');
                        }
                        response = await fileWriter.patchFiles(request.files);
                        break;
                    case 'copy-files':
                        if (!request.sourceDir || !request.destDir) {
                            throw new Error('sourceDir et destDir sont requis pour copy-files.');
                        }
                        response = await fileWriter.copyFiles(request.sourceDir, request.destDir, request.extensions || []);
                        break;
                    case 'move-files':
                        if (!request.sourceDir || !request.destDir) {
                            throw new Error('sourceDir et destDir sont requis pour move-files.');
                        }
                        response = await fileWriter.moveFiles(request.sourceDir, request.destDir, request.extensions || []);
                        break;
                    case 'rename-files':
                        if (!request.dirPath || !request.renamePattern || !request.renamePattern.search || request.renamePattern.replace === undefined) {
                            throw new Error('dirPath et renamePattern (search, replace) sont requis pour rename-files.');
                        }
                        response = await fileWriter.renameFiles(request.dirPath, request.extensions || [], request.renamePattern);
                        break;
                    default:
                        // throw new Error('Commande non reconnue. Utilisez "run-tests", "git-commit", "git-push", "execute-command", "init-git", "create-file", "get-file", "list-files", "create-files", "update-files", "delete-files", "patch-files", "copy-files", "move-files" ou "rename-files".');
                        throw new Error('Commande non reconnue. Utilisez "run-tests", "execute-command", "create-file", "get-file", "list-files", "create-files", "update-files", "delete-files", "patch-files", "copy-files", "move-files" ou "rename-files".');
                }
                response.requestId = requestId;
                ws.send(JSON.stringify(response));
                log(`Réponse envoyée pour ${command} (requestId: ${requestId})`);
            } catch (e: any) {
                log(`ERREUR lors de l'exécution de ${command} (requestId: ${requestId}): ${e.message || 'Erreur inconnue'}`);
                ws.send(JSON.stringify({
                    requestId,
                    status: 'error',
                    message: e.message || 'Erreur inconnue'
                }));
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
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                    }
                    h1 {
                        margin-bottom: 20px;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        max-width: 500px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    /* th {
                        background-color: #f2f2f2;
                    } */
                    input {
                        width: 100%;
                        padding: 5px;
                        box-sizing: border-box;
                    }
                    button {
                        padding: 10px 20px;
                        margin-top: 20px;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <h1>TypeScript VSCode Interface Configuration</h1>
                <table>
                    <tr>
                        <th>Paramètre</th>
                        <th>Valeur</th>
                    </tr>
                    <tr>
                        <td>Port WebSocket</td>
                        <td><input type="number" id="port" value="${port}"></td>
                    </tr>
                    <tr>
                        <td>Nom de la tâche</td>
                        <td><input type="text" id="taskName" value="${taskName}"></td>
                    </tr>
                    <tr>
                        <td>Dossier des tests</td>
                        <td><input type="text" id="testDir" value="${testDir}"></td>
                    </tr>
                </table>
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