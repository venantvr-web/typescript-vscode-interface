#!/bin/bash

# Set project path dynamically
PROJECT_PATH=$(pwd)

# Instruction 2: Créer un environnement virtuel
wscat -c ws://localhost:3000 -x '{"requestId":"8001","command":"execute-command","shellCommand":"python3 -m venv venv"}'
# sleep 5

# Instruction 3: Installer pytest
wscat -c ws://localhost:3000 -x '{"requestId":"8002","command":"execute-command","shellCommand":". venv/bin/activate"}'
# sleep 5

# Instruction 4: Set PYTHONPATH in the persistent shell
wscat -c ws://localhost:3000 -x '{"requestId":"8003","command":"execute-command","shellCommand":"which python3"}'
# sleep 5
