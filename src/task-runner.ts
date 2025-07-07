import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

interface CommandResult {
    status: string;
    stdout: string;
    stderr: string;
}

export class TaskRunner {
    private workspacePath: string;
    private taskName: string;
    private log: (message: string) => void;
    private shell: ChildProcess | null = null;
    private stdoutBuffer: string = '';
    private stderrBuffer: string = '';

    constructor(workspacePath: string, taskName: string, log: (message: string) => void) {
        this.workspacePath = workspacePath;
        this.taskName = taskName;
        this.log = log;
        this.initializeShell();
    }

    private initializeShell() {
        if (!this.shell) {
            this.log('Initializing persistent shell...');
            this.shell = spawn('bash', [], {
                cwd: this.workspacePath,
                shell: true
            });

            // Capturer stdout
            this.shell.stdout!.on('data', (data) => {
                const output = data.toString();
                this.stdoutBuffer += output;
                this.log(`Shell stdout: ${output}`);
            });

            // Capturer stderr
            this.shell.stderr!.on('data', (data) => {
                const error = data.toString();
                this.stderrBuffer += error;
                this.log(`Shell stderr: ${error}`);
            });

            // Gérer la fermeture du shell
            this.shell.on('close', (code) => {
                this.log(`Shell closed with code ${code}`);
                this.shell = null;
            });
        }
    }

    async runTests(outputFile?: string): Promise<CommandResult> {
        this.log(`Commande "run-tests" reçue`);
        try {
            const shellCommand = `pytest tests --json-report${outputFile ? ` --json-report-file=${outputFile}` : ''}`;
            return await this.executeCommand(shellCommand, outputFile);
        } catch (error: any) {
            this.log(`ERREUR lors de l'exécution de run-tests: ${error.message || 'Erreur inconnue'}`);
            throw new Error(`${error.message || 'Erreur inconnue'}${error.stderr ? `\nstderr: ${error.stderr}` : ''}`);
        }
    }

    async executeCommand(shellCommand: string, outputFile?: string): Promise<CommandResult> {
        if (!shellCommand || typeof shellCommand !== 'string') {
            this.log(`ERREUR: shellCommand manquant ou invalide pour execute-command`);
            throw new Error('shellCommand (chaîne non vide) est requis pour execute-command.');
        }
        this.log(`Commande "execute-command" reçue: ${shellCommand}`);
        try {
            if (!this.shell) {
                throw new Error('Failed to initialize shell');
            }

            // Vider les buffers avant chaque commande
            this.stdoutBuffer = '';
            this.stderrBuffer = '';

            // Envoyer la commande au shell
            this.shell.stdin!.write(`${shellCommand}\n`);

            // Attendre un court délai pour collecter les sorties (les commandes sont espacées par sleep 1)
            await new Promise(resolve => setTimeout(resolve, 1000));

            const result: CommandResult = {
                status: 'success',
                stdout: this.stdoutBuffer,
                stderr: this.stderrBuffer
            };

            if (outputFile) {
                await fs.promises.writeFile(path.join(this.workspacePath, outputFile), result.stdout + result.stderr);
                this.log(`Sortie écrite dans le fichier: ${outputFile}`);
            }

            return result;
        } catch (error: any) {
            this.log(`ERREUR lors de l'exécution de la commande: ${error.message || 'Erreur inconnue'}`);
            if (error.stderr) {
                this.log(`Détails de l'erreur (stderr):\n${error.stderr}`);
            }
            throw new Error(`${error.message || 'Erreur inconnue'}${error.stderr ? `\nstderr: ${error.stderr}` : ''}`);
        }
    }

    dispose() {
        if (this.shell) {
            this.shell.kill();
            this.shell = null;
            this.log('Persistent shell terminated.');
        }
    }
}