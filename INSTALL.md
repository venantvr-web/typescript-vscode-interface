# Installation Guide for TypeScript VSCode Interface Extension

This document provides detailed instructions for installing the **TypeScript VSCode Interface** extension, a WebSocket-based extension for running tasks, managing files, and executing tests in VSCode. The extension is designed to work with projects like `Python.VsCode.Interface`, enabling automation via scripts such as `setup_project_pytest_persistent.sh`.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup Project Directory](#setup-project-directory)
- [Compile the Extension](#compile-the-extension)
- [Package the Extension](#package-the-extension)
- [Install the Extension](#install-the-extension)
- [Configure the Extension](#configure-the-extension)
- [Verify Installation](#verify-installation)
- [Test with a Project](#test-with-a-project)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Prerequisites

Before installing the extension, ensure the following are installed and configured:

- **Node.js and npm**:
    - Required for compiling and packaging the extension.
    - Install Node.js (version 16.x or higher) and npm (version 8.x or higher):
      ```bash
      sudo apt update
      sudo apt install nodejs npm
      node --version  # Should output v16.x or higher
      npm --version   # Should output 8.x or higher
      ```
    - If needed, install a specific version using `nvm`:
      ```bash
      curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
      nvm install 16
      nvm use 16
      ```

- **VSCode CLI**:
    - Ensure Visual Studio Code is installed and accessible via the `code` command:
      ```bash
      code --version
      ```
    - If not installed, download and install from [code.visualstudio.com](https://code.visualstudio.com/) or via:
      ```bash
      sudo snap install code --classic
      ```

- **vsce**:
    - The VSCode Extension CLI for packaging the extension.
    - Install globally:
      ```bash
      npm install -g vsce
      vsce --version
      ```

- **Project Directory**:
    - The extension source code should be in `~/WebstormProjects/typescript-vscode-interface`, containing:
        - `src/extension.ts`
        - `src/task-runner.ts`
        - `src/file-reader.ts`
        - `src/file-writer.ts`
        - `src/utils.ts`
        - `package.json`
        - `LICENSE.md`
    - If any files are missing, contact the project maintainer or refer to the repository at `https://github.com/venantvr/Python.VsCode.Interface`.

## Setup Project Directory

1. **Clone or Verify the Repository**:
    - If you haven't already, clone the extension repository or ensure it exists:
      ```bash
      cd ~/WebstormProjects
      git clone <repository-url> typescript-vscode-interface
      ```
      Replace `<repository-url>` with the actual repository URL if available.
    - Alternatively, verify the directory exists:
      ```bash
      ls ~/WebstormProjects/typescript-vscode-interface
      ```
      Expected: `package.json src LICENSE.md`

2. **Install Dependencies**:
    - Navigate to the project directory:
      ```bash
      cd ~/WebstormProjects/typescript-vscode-interface
      ```
    - Install dependencies specified in `package.json`:
      ```bash
      npm install
      ```
    - This installs `ws`, `json-patch`, `@types/vscode`, `@types/node`, `@types/ws`, `@types/json-patch`, `@types/mocha`, and `typescript`.

3. **Verify `package.json`**:
    - Ensure the `name` field is valid:
      ```bash
      grep '"name"' ~/WebstormProjects/typescript-vscode-interface/package.json
      ```
      Expected: `"name": "typescript-vscode-interface"`
    - Confirm required fields:
      ```json
      {
        "name": "typescript-vscode-interface",
        "displayName": "TypeScript VSCode Interface",
        "version": "0.0.1",
        "publisher": "xAI",
        "main": "./out/extension.js"
      }
      ```

## Compile the Extension

Compile the TypeScript source files to JavaScript for packaging:

```bash
cd ~/WebstormProjects/typescript-vscode-interface
npm run compile
```

- This runs `tsc -p ./`, generating files in the `out/` directory (e.g., `out/extension.js`, `out/task-runner.js`).
- Verify compilation:
  ```bash
  ls ~/WebstormProjects/typescript-vscode-interface/out
  ```
  Expected: `extension.js task-runner.js file-reader.js file-writer.js utils.js`

## Package the Extension

Create a VSIX file for the extension:

```bash
cd ~/WebstormProjects/typescript-vscode-interface
vsce package
```

- This generates `typescript-vscode-interface-0.0.1.vsix` in the project directory.
- Verify the VSIX file:
  ```bash
  ls ~/WebstormProjects/typescript-vscode-interface/*.vsix
  ```
  Expected: `typescript-vscode-interface-0.0.1.vsix`

## Install the Extension

Install the extension permanently in VSCode:

```bash
code --install-extension ~/WebstormProjects/typescript-vscode-interface/typescript-vscode-interface-0.0.1.vsix
```

- This installs the extension globally, making it available in all VSCode workspaces until uninstalled.
- Verify installation:
  ```bash
  code --list-extensions | grep typescript-vscode-interface
  ```
  Expected: `xAI.typescript-vscode-interface`

## Configure the Extension

The extension uses workspace settings for the WebSocket port, task name, and test directory. Configure these settings:

1. **Using the Configuration UI**:
    - Open VSCode:
      ```bash
      code
      ```
    - Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS).
    - Run `TypeScript VSCode Interface: Configure Settings`.
    - Set:
        - **Port WebSocket**: `3000`
        - **Nom de la tâche**: `run-tests`
        - **Dossier des tests**: `tests`
    - Save the configuration.

2. **Manually Edit Settings**:
    - Open or create `~/PycharmProjects/Python.VsCode.Interface/.vscode/settings.json`:
      ```bash
      mkdir -p ~/PycharmProjects/Python.VsCode.Interface/.vscode
      nano ~/PycharmProjects/Python.VsCode.Interface/.vscode/settings.json
      ```
    - Add:
      ```json
      {
        "typescriptVscodeInterface.port": 3000,
        "typescriptVscodeInterface.taskName": "run-tests",
        "typescriptVscodeInterface.testDir": "tests"
      }
      ```

## Verify Installation

1. **Check Extension in VSCode**:
    - Open VSCode and go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
    - Search for "TypeScript VSCode Interface" and confirm it’s installed.

2. **Test WebSocket Server**:
    - Open a workspace in VSCode (e.g., `~/PycharmProjects/Python.VsCode.Interface`):
      ```bash
      code ~/PycharmProjects/Python.VsCode.Interface
      ```
    - Check if the WebSocket server is running:
      ```bash
      netstat -tuln | grep 3000
      ```
      Expected: `tcp 0 0 127.0.0.1:3000 0.0.0.0:* LISTEN`

3. **Check Logs**:
    - In VSCode, go to **View > Output > TypeScript VSCode Interface Logs**.
    - Look for:
      ```
      [2025-07-10T09:21:00.000Z] Extension TypeScript VSCode Interface activée.
      [2025-07-10T09:21:00.000Z] Serveur WebSocket démarré avec succès.
      ```

## Test with a Project

To verify the extension’s functionality, use the `setup_project_pytest_persistent.sh` script to set up a Python project and run tests:

1. **Run the Script**:
   ```bash
   cd ~/PycharmProjects/Python.VsCode.Interface
   chmod +x setup_project_pytest_persistent.sh
   ./setup_project_pytest_persistent.sh
   ```

2. **Verify Test Results**:
    - After the script completes (instruction 27), check the test output:
      ```bash
      cat ~/PycharmProjects/Python.VsCode.Interface/test_results.json
      ```
      Expected: JSON with 21 tests passed, e.g.:
      ```json
      {
        "tests": [
          {
            "nodeid": "tests/test_math.py::TestMath::test_add",
            "outcome": "passed",
            "duration": 0.001
          },
          ...
        ],
        "summary": {
          "total": 21,
          "passed": 21,
          "failed": 0
        }
      }
      ```

3. **Verify Git Push**:
    - After instruction 29, confirm changes are pushed to the repository:
      ```bash
      git -C ~/PycharmProjects/Python.VsCode.Interface log --oneline
      ```
      Expected: Commits including "Initial commit" and "Add 20 classes and tests".

## Troubleshooting

- **If `vsce package` Fails**:
    - Verify `package.json`:
      ```bash
      grep '"name"' ~/WebstormProjects/typescript-vscode-interface/package.json
      ```
      Expected: `"name": "typescript-vscode-interface"`
    - Reinstall `vsce`:
      ```bash
      npm install -g vsce
      ```

- **If Extension Doesn’t Load**:
    - Check installed extensions:
      ```bash
      code --list-extensions | grep typescript-vscode-interface
      ```
      Expected: `xAI.typescript-vscode-interface`
    - Verify logs in VSCode (**View > Output > TypeScript VSCode Interface Logs**).

- **If WebSocket Server Doesn’t Start**:
    - Ensure port 3000 is free:
      ```bash
      netstat -tuln | grep 3000
      ```
      If in use, kill the process:
      ```bash
      fuser -k 3000/tcp
      ```
    - Restart VSCode:
      ```bash
      code ~/PycharmProjects/Python.VsCode.Interface
      ```

- **If `ModuleNotFoundError: No module named 'src'`**:
    - Verify `PYTHONPATH` (instruction 4):
      ```bash
      wscat -c ws://localhost:3000 -x '{"requestId":"7033","command":"execute-command","shellCommand":"echo $PYTHONPATH"}'
      ```
      Expected: Includes `/home/rvv/PycharmProjects/Python.VsCode.Interface`.
    - Test manually:
      ```bash
      cd ~/PycharmProjects/Python.VsCode.Interface
      . venv/bin/activate
      PYTHONPATH=$PYTHONPATH:${PWD} pytest tests
      ```

- **If `git push` Fails (Instruction 29)**:
    - Ensure credentials are set:
      ```bash
      wscat -c ws://localhost:3000 -x '{"requestId":"7029","command":"execute-command","shellCommand":"git push https://venantvr:<your-token>@github.com/venantvr/Python.VsCode.Interface.git main"}'
      ```
    - Replace `<your-token>` with a valid GitHub personal access token.

- **If Extension Breaks After VSCode Update**:
    - Reinstall the VSIX:
      ```bash
      code --install-extension ~/WebstormProjects/typescript-vscode-interface/typescript-vscode-interface-0.0.1.vsix
      ```
    - Check `engines.vscode` in `package.json` for compatibility.

## License

This extension is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.