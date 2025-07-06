import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

export class TaskRunner {
    private workspacePath: string;
    private taskName: string;
    private log: (message: string) => void;

    constructor(workspacePath: string, taskName: string, log: (message: string) => void) {
        this.workspacePath = workspacePath;
        this.taskName = taskName;
        this.log = log;
    }

    async runTests(outputFile?: string): Promise<any> {
        this.log(`Commande "run-tests" reçue`);
        try {
            const execAsync = promisify(exec);
            this.log(`Exécution de la commande CLI: code --folder-uri file://${this.workspacePath} --run-task ${this.taskName}`);
            const { stdout, stderr } = await execAsync(
                `code --folder-uri file://${this.workspacePath} --run-task ${this.taskName}`
            );

            this.log('Commande exécutée avec succès.');
            this.log(`Sortie standard (stdout):\n${stdout}`);
            if (stderr) {
                this.log(`Sortie d'erreur (stderr):\n${stderr}`);
            } else {
                this.log('Aucune erreur stderr détectée.');
            }

            const response = { status: 'success', stdout, stderr };
            if (outputFile && typeof outputFile === 'string') {
                try {
                    const filePath = path.join(this.workspacePath, outputFile);
                    const fileUri = vscode.Uri.file(filePath);
                    const content = new TextEncoder().encode(JSON.stringify(response, null, 2));
                    await vscode.workspace.fs.writeFile(fileUri, content);
                    this.log(`Résultats écrits dans le fichier: ${filePath}`);
                } catch (e: any) {
                    this.log(`ERREUR lors de l'écriture du fichier ${outputFile}: ${e.message || 'Erreur inconnue'}`);
                    throw new Error(`Échec de l'écriture du fichier ${outputFile}: ${e.message || 'Erreur inconnue'}`);
                }
            }

            return response;
        } catch (error: any) {
            this.log(`ERREUR lors de l'exécution de la commande: ${error.message || 'Erreur inconnue'}`);
            if (error.stderr) {
                this.log(`Détails de l'erreur (stderr):\n${error.stderr}`);
            }
            throw new Error(`${error.message || 'Erreur inconnue'}${error.stderr ? `\nstderr: ${error.stderr}` : ''}`);
        }
    }

    /* async gitCommit(message: string): Promise<any> {
        if (!message || typeof message !== 'string') {
            this.log(`ERREUR: message manquant ou invalide pour git-commit`);
            throw new Error('message (chaîne non vide) est requis pour git-commit.');
        }

        this.log(`Commande "git-commit" reçue avec message: ${message}`);
        try {
            const gitDir = path.join(this.workspacePath, '.git');
            if (!fs.existsSync(gitDir)) {
                this.log(`ERREUR: ${this.workspacePath} n'est pas un dépôt Git`);
                throw new Error(`${this.workspacePath} n'est pas un dépôt Git.`);
            }

            const execAsync = promisify(exec);
            this.log(`Exécution de git add .`);
            await execAsync(`git add .`, { cwd: this.workspacePath });
            this.log(`Exécution de git commit -m "${message}"`);
            const { stdout, stderr } = await execAsync(`git commit -m "${message}"`, { cwd: this.workspacePath });

            this.log('Commande git commit exécutée avec succès.');
            this.log(`Sortie standard (stdout):\n${stdout}`);
            if (stderr) {
                this.log(`Sortie d'erreur (stderr):\n${stderr}`);
            } else {
                this.log('Aucune erreur stderr détectée.');
            }

            return { status: 'success', stdout, stderr };
        } catch (error: any) {
            this.log(`ERREUR lors de l'exécution de git-commit: ${error.message || 'Erreur inconnue'}`);
            if (error.stderr) {
                this.log(`Détails de l'erreur (stderr):\n${error.stderr}`);
            }
            throw new Error(`${error.message || 'Erreur inconnue'}${error.stderr ? `\nstderr: ${error.stderr}` : ''}`);
        }
    } */

    /* async gitPush(): Promise<any> {
        this.log(`Commande "git-push" reçue`);
        try {
            const gitDir = path.join(this.workspacePath, '.git');
            if (!fs.existsSync(gitDir)) {
                this.log(`ERREUR: ${this.workspacePath} n'est pas un dépôt Git`);
                throw new Error(`${this.workspacePath} n'est pas un dépôt Git.`);
            }

            const execAsync = promisify(exec);
            this.log(`Exécution de git push`);
            const { stdout, stderr } = await execAsync(`git push`, { cwd: this.workspacePath });

            this.log('Commande git push exécutée avec succès.');
            this.log(`Sortie standard (stdout):\n${stdout}`);
            if (stderr) {
                this.log(`Sortie d'erreur (stderr):\n${stderr}`);
            } else {
                this.log('Aucune erreur stderr détectée.');
            }

            return { status: 'success', stdout, stderr };
        } catch (error: any) {
            this.log(`ERREUR lors de l'exécution de git-push: ${error.message || 'Erreur inconnue'}`);
            if (error.stderr) {
                this.log(`Détails de l'erreur (stderr):\n${error.stderr}`);
            }
            throw new Error(`${error.message || 'Erreur inconnue'}${error.stderr ? `\nstderr: ${error.stderr}` : ''}`);
        }
    } */

    async executeCommand(shellCommand: string, outputFile?: string): Promise<any> {
        if (!shellCommand || typeof shellCommand !== 'string') {
            this.log(`ERREUR: shellCommand manquant ou invalide pour execute-command`);
            throw new Error('shellCommand (chaîne non vide) est requis pour execute-command.');
        }
        this.log(`Commande "execute-command" reçue: ${shellCommand}`);
        try {
            const execAsync = promisify(exec);
            this.log(`Exécution de la commande: ${shellCommand}`);
            const { stdout, stderr } = await execAsync(shellCommand, { cwd: this.workspacePath });
            this.log('Commande exécutée avec succès.');
            this.log(`Sortie standard (stdout):\n${stdout}`);
            if (stderr) {
                this.log(`Sortie d'erreur (stderr):\n${stderr}`);
            } else {
                this.log('Aucune erreur stderr détectée.');
            }
            if (outputFile) {
                await fs.promises.writeFile(path.join(this.workspacePath, outputFile), stdout + stderr);
                this.log(`Sortie écrite dans le fichier: ${outputFile}`);
            }
            return { status: 'success', stdout, stderr };
        } catch (error: any) {
            this.log(`ERREUR lors de l'exécution de la commande: ${error.message || 'Erreur inconnue'}`);
            if (error.stderr) {
                this.log(`Détails de l'erreur (stderr):\n${error.stderr}`);
            }
            throw new Error(`${error.message || 'Erreur inconnue'}${error.stderr ? `\nstderr: ${error.stderr}` : ''}`);
        }
    }

    /* async initGit(remoteUrl?: string): Promise<any> {
        this.log(`Commande "init-git" reçue avec remoteUrl: ${remoteUrl || 'aucun'}`);
        try {
            const gitDir = path.join(this.workspacePath, '.git');
            const execAsync = promisify(exec);

            if (fs.existsSync(gitDir)) {
                this.log(`Le dossier ${this.workspacePath} est déjà un dépôt Git`);
                return { status: 'success', message: 'Le dossier est déjà un dépôt Git.' };
            }

            this.log(`Exécution de git init`);
            await execAsync(`git init`, { cwd: this.workspacePath });

            if (remoteUrl && typeof remoteUrl === 'string') {
                this.log(`Ajout du remote: git remote add origin ${remoteUrl}`);
                await execAsync(`git remote add origin ${remoteUrl}`, { cwd: this.workspacePath });
            }

            // Créer un README.md initial si aucun fichier n'existe
            const readmePath = path.join(this.workspacePath, 'README.md');
            if (!fs.existsSync(readmePath)) {
                this.log(`Création de README.md`);
                await vscode.workspace.fs.writeFile(
                    vscode.Uri.file(readmePath),
                    new TextEncoder().encode('# Test Project\n')
                );
                this.log(`Exécution de git add README.md`);
                await execAsync(`git add README.md`, { cwd: this.workspacePath });
                this.log(`Exécution de git commit -m "Initial commit"`);
                await execAsync(`git commit -m "Initial commit"`, { cwd: this.workspacePath });
                this.log(`Exécution de git branch -M main`);
                await execAsync(`git branch -M main`, { cwd: this.workspacePath });
            }

            this.log('Dépôt Git initialisé avec succès.');
            return { status: 'success', message: 'Dépôt Git initialisé.' };
        } catch (error: any) {
            this.log(`ERREUR lors de l'initialisation du dépôt Git: ${error.message || 'Erreur inconnue'}`);
            if (error.stderr) {
                this.log(`Détails de l'erreur (stderr):\n${error.stderr}`);
            }
            throw new Error(`${error.message || 'Erreur inconnue'}${error.stderr ? `\nstderr: ${error.stderr}` : ''}`);
        }
    } */
}