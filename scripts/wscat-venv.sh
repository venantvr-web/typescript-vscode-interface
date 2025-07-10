#!/bin/bash

# Set project path dynamically
PROJECT_PATH=$(pwd)

# Instruction 1: Créer un environnement virtuel
wscat -c ws://localhost:3000 -x '{"requestId":"8001","command":"execute-command","shellCommand":"python3 -m venv venv"}'

# Instruction 2: Activer l'environnement virtuel
wscat -c ws://localhost:3000 -x '{"requestId":"8002","command":"execute-command","shellCommand":". venv/bin/activate"}'

# Instruction 3: Test de l'environnement virtuel
wscat -c ws://localhost:3000 -x '{"requestId":"8003","command":"execute-command","shellCommand":"which python3"}'
