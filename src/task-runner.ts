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
}