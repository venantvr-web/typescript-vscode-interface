# Python.VsCode.Interface Project

This project, `Python.VsCode.Interface`, is a Python module with mathematical utilities and corresponding unit tests, orchestrated via a TypeScript-based VSCode extension (`typescript-vscode-interface`) that provides a WebSocket server for file and command operations. This README details the setup, execution, and troubleshooting steps discussed in the session, ensuring comprehensive coverage of all commands and configurations.

## Project Overview

- **Python Project** (`~/PycharmProjects/Python.VsCode.Interface`):
    - Contains a `src/math_utils.py` module with 20 classes and one function (`add`) for mathematical operations.
    - Includes 21 `unittest`-based tests in the `tests/` directory, compatible with `pytest` for JSON reporting.
    - Uses a virtual environment (`venv`) and `pytest` with `pytest-json-report` for test execution and output.
    - Managed via a Bash script (`setup_project_pytest_persistent.sh`) that automates setup and testing.

- **TypeScript VSCode Extension** (`~/WebstormProjects/typescript-vscode-interface`):
    - Provides a WebSocket server (port 3000) for executing shell commands and managing files.
    - Implements a persistent shell via `task-runner.ts` to maintain environment variables like `PYTHONPATH`.
    - Handles commands like `create-file`, `execute-command`, and `run-tests` for project automation.

## Project Structure

After running the setup script, the Python project directory (`~/PycharmProjects/Python.VsCode.Interface`) has the following structure:

```
README.md
src/
  math_utils.py
tests/
  test_absolute.py
  test_average.py
  test_calculator.py
  test_ceiling.py
  test_counter.py
  test_cube.py
  test_divider.py
  test_factorial.py
  test_floor.py
  test_is_even.py
  test_is_odd.py
  test_length.py
  test_math.py
  test_max_finder.py
  test_min_finder.py
  test_modulo.py
  test_power.py
  test_rounder.py
  test_square.py
  test_subtractor.py
  test_sum_list.py
venv/
test_results.json
setup_project_pytest_persistent.sh
```

The TypeScript extension directory (`~/WebstormProjects/typescript-vscode-interface`) contains:

```
src/
  extension.ts
  task-runner.ts
  file-reader.ts
  file-writer.ts
  utils.ts
package.json
tsconfig.json
```

## Setup Instructions

### Prerequisites

- **System**: Linux (e.g., Ubuntu) with Bash.
- **Tools**:
    - Node.js and `npm` for the TypeScript extension.
    - Python 3.12 for the Python project.
    - VSCode for running the extension.
    - `wscat` for WebSocket communication (`npm install -g wscat`).
- **Repositories**:
    - Python project: `https://github.com/venantvr/Python.VsCode.Interface.git`
    - TypeScript extension: Assumed to be in `~/WebstormProjects/typescript-vscode-interface`.

### Bootstrapping the TypeScript Extension

1. **Navigate to the extension directory**:
   ```bash
   cd ~/WebstormProjects/typescript-vscode-interface
   ```

2. **Install dependencies**:
   Ensure `@types/node` is installed to resolve TypeScript errors for the `http` module:
   ```bash
   npm install --save-dev @types/node
   ```
   Verify in `package.json`:
   ```json
   "devDependencies": {
     "@types/node": "^18.0.0",
     ...
   }
   ```

3. **Compile the extension**:
   ```bash
   npm run compile
   ```
   This runs `tsc -p ./` to compile `src/extension.ts` and other TypeScript files.

4. **Launch VSCode with the extension**:
   ```bash
   code --extensionDevelopmentPath=~/WebstormProjects/typescript-vscode-interface
   ```

5. **Verify WebSocket server**:
   The extension starts a WebSocket server on port 3000. Check:
   ```bash
   netstat -tuln | grep 3000
   ```
   Expected output:
   ```
   tcp 0 0 127.0.0.1:3000 0.0.0.0:* LISTEN
   ```

### Bootstrapping the Python Project

1. **Navigate to the project directory**:
   ```bash
   cd ~/PycharmProjects/Python.VsCode.Interface
   ```

2. **Save the setup script**:
   Copy the content of `setup_project_pytest_persistent.sh` (artifact ID `650dcac4-b209-4f04-bd77-50354515f15f`, version ID `380eb176-d33e-404c-a9a2-1d31e3567780`) into `~/PycharmProjects/Python.VsCode.Interface/setup_project_pytest_persistent.sh`.

3. **Make the script executable**:
   ```bash
   chmod +x setup_project_pytest_persistent.sh
   ```

4. **Run the setup script**:
   ```bash
   ./setup_project_pytest_persistent.sh
   ```
   Alternatively, execute instructions individually starting with instruction 1:
   ```bash
   wscat -c ws://localhost:3000 -x '{"requestId":"7001","command":"execute-command","shellCommand":"git init && echo \"# Python.VsCode.Interface\" > README.md && git add README.md && git commit -m \"Initial commit\" && git remote add origin https://github.com/venantvr/Python.VsCode.Interface.git && git branch -M main"}'
   ```

### Setup Script Details

The script (`setup_project_pytest_persistent.sh`) automates the project setup with 28 instructions, executed via the WebSocket server. Each instruction sends a command to the VSCode extension, leveraging the persistent shell in `task-runner.ts`.

- **Instruction 1: Initialize Git repository**:
  ```bash
  wscat -c ws://localhost:3000 -x '{"requestId":"7001","command":"execute-command","shellCommand":"git init && echo \"# Python.VsCode.Interface\" > README.md && git add README.md && git commit -m \"Initial commit\" && git remote add origin https://github.com/venantvr/Python.VsCode.Interface.git && git branch -M main"}'
  ```
    - Initializes a Git repository, creates `README.md`, commits it, sets the remote, and renames the branch to `main`.

- **Instruction 2: Create virtual environment**:
  ```bash
  wscat -c ws://localhost:3000 -x '{"requestId":"7002","command":"execute-command","shellCommand":"python3 -m venv venv"}'
  ```
    - Creates a virtual environment in `venv/`.

- **Instruction 3: Install pytest**:
  ```bash
  wscat -c ws://localhost:3000 -x '{"requestId":"7003","command":"execute-command","shellCommand":". venv/bin/activate && pip install pytest pytest-json-report"}'
  ```
    - Activates the virtual environment and installs `pytest` and `pytest-json-report`.

- **Instruction 4: Set PYTHONPATH**:
  ```bash
  wscat -c ws://localhost:3000 -x '{"requestId":"7004","command":"execute-command","shellCommand":"export PYTHONPATH=$PYTHONPATH:'${PROJECT_PATH}'"}'
  ```
    - Sets `PYTHONPATH` to include the project root dynamically (`PROJECT_PATH=$(pwd)`), resolving `ModuleNotFoundError: No module named 'src'`.

- **Instruction 5: Create `math_utils.py`**:
  ```bash
  wscat -c ws://localhost:3000 -x '{"requestId":"7005","command":"create-file","filePath":"src/math_utils.py","content":"..."}'
  ```
    - Creates `src/math_utils.py` with 20 classes (`Calculator`, `Counter`, `Divider`, `Subtractor`, `Power`, `Modulo`, `Square`, `Cube`, `MaxFinder`, `MinFinder`, `Average`, `Factorial`, `Absolute`, `Rounder`, `Floor`, `Ceiling`, `IsEven`, `IsOdd`, `SumList`, `Length`) and one function (`add`).

- **Instructions 6–25: Create test files**:
    - Create 21 test files (`tests/test_*.py`) for each function/class using `unittest`. Example for `test_math.py`:
      ```bash
      wscat -c ws://localhost:3000 -x '{"requestId":"7006","command":"create-file","filePath":"tests/test_math.py","content":"import unittest\nfrom src.math_utils import add\n\nclass TestMath(unittest.TestCase):\n    def test_add(self):\n        self.assertEqual(add(2, 3), 5)\n"}'
      ```
    - Files: `test_math.py`, `test_calculator.py`, `test_counter.py`, `test_divider.py`, `test_subtractor.py`, `test_power.py`, `test_modulo.py`, `test_square.py`, `test_cube.py`, `test_max_finder.py`, `test_min_finder.py`, `test_average.py`, `test_factorial.py`, `test_absolute.py`, `test_rounder.py`, `test_floor.py`, `test_ceiling.py`, `test_is_even.py`, `test_is_odd.py`, `test_sum_list.py`, `test_length.py`.
    - Each test file imports from `src.math_utils` and tests a specific function/class method.

- **Instruction 26: Run tests with pytest**:
  ```bash
  wscat -c ws://localhost:3000 -x '{"requestId":"7026","command":"execute-command","shellCommand":". venv/bin/activate && pytest tests --json-report --json-report-file=test_results.json","outputFile":"test_results.json"}'
  ```
    - Activates the virtual environment and runs `pytest` to execute all tests, generating `test_results.json`.

- **Instruction 27: Commit changes**:
  ```bash
  wscat -c ws://localhost:3000 -x '{"requestId":"7027","command":"execute-command","shellCommand":"git add . && git commit -m \"Add 20 classes and tests\""}'
  ```
    - Commits all changes with a descriptive message.

- **Instruction 28: Push to GitHub**:
  ```bash
  wscat -c ws://localhost:3000 -x '{"requestId":"7028","command":"execute-command","shellCommand":"git push origin main"}'
  ```
    - Pushes the changes to the remote repository.

### Key Modifications and Fixes

#### TypeScript Extension (`extension.ts`)

- **Issue**: Compilation error `TS2503: Cannot find namespace 'http'` in `extension.ts` (line 49).
- **Fix**: Added `import * as http from 'http';` and installed `@types/node`:
  ```bash
  cd ~/WebstormProjects/typescript-vscode-interface
  npm install --save-dev @types/node
  ```
- **File**: `src/extension.ts` (artifact ID `e23d3b09-f825-4e3a-a4e7-ed6d6d18ad53`, version ID `5cc4753c-93b4-4015-a545-ec7800acdf66`).
- **Details**: The extension sets up a WebSocket server on port 3000, logs to the VSCode output channel (`TypeScript VSCode Interface Logs`), and supports commands like `create-file` and `execute-command`. Added `taskRunner.dispose()` to clean up the persistent shell on extension deactivation.

#### Persistent Shell (`task-runner.ts`)

- **File**: `src/task-runner.ts` (artifact ID `85ea571b-c76f-41ba-a455-3369882bd328`, version ID `eecec400-0d5b-4b6a-8a0a-e46514148ac3`).
- **Details**: Implements a persistent Bash shell using `child_process.spawn('bash')` to maintain environment variables (e.g., `PYTHONPATH`) across commands. Captures `stdout` and `stderr`, writes output to files (e.g., `test_results.json`), and supports `run-tests` and `execute-command`.

#### Python Test Issue

- **Issue**: `pytest` failed with `ModuleNotFoundError: No module named 'src'` in `tests/test_subtractor.py` and other test files.
- **Cause**: `pytest` does not automatically include the project root in `PYTHONPATH`, unlike `unittest`.
- **Fix**: Added instruction 4 to set `PYTHONPATH` dynamically in the persistent shell:
  ```bash
  export PYTHONPATH=$PYTHONPATH:$PROJECT_PATH
  ```
    - `PROJECT_PATH=$(pwd)` ensures the project root is dynamically set.
    - Applied in instruction 26 for `pytest`:
      ```bash
      . venv/bin/activate && pytest tests --json-report --json-report-file=test_results.json
      ```

#### Bash Script Updates

- **File**: `setup_project_pytest_persistent.sh` (artifact ID `650dcac4-b209-4f04-bd77-50354515f15f`, version ID `380eb176-d33e-404c-a9a2-1d31e3567780`).
- **Changes**:
    - Added `PROJECT_PATH=$(pwd)` at the script's start.
    - Inserted instruction 4 to set `PYTHONPATH` in the persistent shell.
    - Updated instruction 26 to run `pytest` with the virtual environment activated, removing redundant `unittest` and broken `pytest` commands.
    - Uncommented instructions 27 and 28 for Git commit and push.
    - Adjusted `requestId` values to maintain sequence (`7004` to `7028`).
    - Kept `sleep 5` for command spacing due to the persistent shell's async nature.

## Verification Steps

After running the script (`./setup_project_pytest_persistent.sh`), verify the setup:

1. **Check project structure**:
   ```bash
   ls -R ~/PycharmProjects/Python.VsCode.Interface
   ```
   Expected:
   ```
   README.md  src  tests  venv  test_results.json  setup_project_pytest_persistent.sh
   ./src:
   math_utils.py
   ./tests:
   test_absolute.py  test_calculator.py  test_counter.py  test_divider.py  test_floor.py
   test_is_even.py  test_is_odd.py  test_length.py  test_max_finder.py  test_min_finder.py
   test_modulo.py  test_power.py  test_rounder.py  test_square.py  test_subtractor.py
   test_sum_list.py  test_average.py  test_ceiling.py  test_cube.py  test_factorial.py
   test_math.py
   ```

2. **Verify test results**:
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

3. **Verify virtual environment**:
   ```bash
   wscat -c ws://localhost:3000 -x '{"requestId":"7030","command":"execute-command","shellCommand":". venv/bin/activate && which python"}'
   ```
   Expected: `/home/rvv/PycharmProjects/Python.VsCode.Interface/venv/bin/python`.

4. **Verify PYTHONPATH**:
   ```bash
   wscat -c ws://localhost:3000 -x '{"requestId":"7031","command":"execute-command","shellCommand":"echo $PYTHONPATH"}'
   ```
   Expected: Includes `/home/rvv/PycharmProjects/Python.VsCode.Interface`.

5. **Check VSCode logs**:
    - In VSCode, go to **View > Output > TypeScript VSCode Interface Logs**.
    - Expected:
      ```
      Initializing persistent shell...
      Shell stdout: Initialized empty Git repository in .../.git/
      Shell stdout: [main (root-commit) ...] Initial commit
      Shell stdout: export PYTHONPATH=...:/home/rvv/PycharmProjects/Python.VsCode.Interface
      ...
      ```

## Troubleshooting

1. **Compilation Error (`TS2503: Cannot find namespace 'http'`)**
    - **Fix**:
      ```bash
      cd ~/WebstormProjects/typescript-vscode-interface
      npm install --save-dev @types/node
      npm run compile
      ```
    - Verify `tsconfig.json`:
      ```json
      {
        "compilerOptions": {
          "module": "commonjs",
          "target": "es6",
          "types": ["node", "vscode"],
          ...
        }
      }
      ```

2. **ModuleNotFoundError: No module named 'src'**:
    - Verify `PYTHONPATH`:
      ```bash
      wscat -c ws://localhost:3000 -x '{"requestId":"7030","command":"execute-command","shellCommand":"echo $PYTHONPATH"}'
      ```
    - Test manually:
      ```bash
      cd ~/PycharmProjects/Python.VsCode.Interface
      . venv/bin/activate
      PYTHONPATH=$PYTHONPATH:${PWD} pytest tests
      ```
    - Ensure instruction 4 ran successfully.

3. **pytest Fails**:
    - Check if `pytest-json-report` is installed:
      ```bash
      wscat -c ws://localhost:3000 -x '{"requestId":"7032","command":"execute-command","shellCommand":". venv/bin/activate && pip show pytest-json-report"}'
      ```
    - Reinstall if needed:
      ```bash
      wscat -c ws://localhost:3000 -x '{"requestId":"7033","command":"execute-command","shellCommand":". venv/bin/activate && pip install pytest-json-report"}'
      ```

4. **Git Push Fails (Instruction 28)**:
    - Use a GitHub token for authentication:
      ```bash
      wscat -c ws://localhost:3000 -x '{"requestId":"7028","command":"execute-command","shellCommand":"git push https://venantvr:<your-token>@github.com/venantvr/Python.VsCode.Interface.git main"}'
      ```

5. **WebSocket Connection Issues**:
    - Ensure the extension is running:
      ```bash
      netstat -tuln | grep 3000
      ```
    - Restart VSCode:
      ```bash
      code --extensionDevelopmentPath=~/WebstormProjects/typescript-vscode-interface
      ```

## Session Artifacts

- **task-runner.ts** (artifact ID `85ea571b-c76f-41ba-a455-3369882bd328`, version ID `eecec400-0d5b-4b6a-8a0a-e46514148ac3`):
    - Implements the persistent shell for command execution.
- **extension.ts** (artifact ID `e23d3b09-f825-4e3a-a4e7-ed6d6d18ad53`, version ID `5cc4753c-93b4-4015-a545-ec7800acdf66`):
    - Main extension logic with WebSocket server and command handling.
- **setup_project_pytest_persistent.sh** (artifact ID `650dcac4-b209-4f04-bd77-50354515f15f`, version ID `380eb176-d33e-404c-a9a2-1d31e3567780`):
    - Automates project setup with dynamic `PYTHONPATH`.

## Additional Notes

- **Test Compatibility**: The `unittest`-based tests are compatible with `pytest`, which generates the JSON report required by `test_results.json`.
- **Persistent Shell**: The `task-runner.ts` ensures `PYTHONPATH` persists across commands, eliminating the need for repeated `export` statements.
- **Dynamic Path**: Using `PROJECT_PATH=$(pwd)` makes the script portable across different machines or directories.
- **Sleep Timing**: `sleep 5` is used between commands to account for the asynchronous nature of the persistent shell.

## Next Steps

To proceed:

1. Ensure the TypeScript extension is compiled and running:
   ```bash
   cd ~/WebstormProjects/typescript-vscode-interface
   npm run compile
   code --extensionDevelopmentPath=~/WebstormProjects/typescript-vscode-interface
   ```
2. Run the setup script:
   ```bash
   cd ~/PycharmProjects/Python.VsCode.Interface
   ./setup_project_pytest_persistent.sh
   ```
3. Verify results:
   ```bash
   cat ~/PycharmProjects/Python.VsCode.Interface/test_results.json
   ```

If errors occur, refer to the **Troubleshooting** section or share the output of failed commands or VSCode logs.