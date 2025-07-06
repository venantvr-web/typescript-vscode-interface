#!/bin/bash

# Instruction 1: Initialiser le dépôt Git
wscat -c ws://localhost:3000 -x '{"requestId":"7001","command":"execute-command","shellCommand":"git init && echo \"# Python.VsCode.Interface\" > README.md && git add README.md && git commit -m \"Initial commit\" && git remote add origin https://github.com/venantvr/Python.VsCode.Interface.git && git branch -M main"}'

# Instruction 2: Créer un environnement virtuel
wscat -c ws://localhost:3000 -x '{"requestId":"7002","command":"execute-command","shellCommand":"python3 -m venv venv"}'

# Instruction 3: Installer pytest
wscat -c ws://localhost:3000 -x '{"requestId":"7003","command":"execute-command","shellCommand":". venv/bin/activate && pip install pytest"}'

# Instruction 4: Créer un module Python
wscat -c ws://localhost:3000 -x '{"requestId":"7004","command":"create-file","filePath":"src/math.py","content":"def add(a, b):\n    return a + b\n"}'

# Instruction 5: Créer un fichier de test
wscat -c ws://localhost:3000 -x '{"requestId":"7005","command":"create-file","filePath":"tests/test_math.py","content":"import unittest\nfrom src.math import add\n\nclass TestMath(unittest.TestCase):\n    def test_add(self):\n        self.assertEqual(add(2, 3), 5)\n"}'

# Instruction 6: Configurer la tâche de test
wscat -c ws://localhost:3000 -x '{"requestId":"7006","command":"create-file","filePath":".vscode/tasks.json","content":"{\n    \"version\": \"2.0.0\",\n    \"tasks\": [\n        {\n            \"label\": \"run-tests\",\n            \"type\": \"shell\",\n            \"command\": \". venv/bin/activate && python3 -m unittest discover tests\",\n            \"group\": {\n                \"kind\": \"test\",\n                \"isDefault\": true\n            }\n        }\n    ]\n}\n"}'

# Instruction 7: Exécuter les tests (première tentative, échouée)
wscat -c ws://localhost:3000 -x '{"requestId":"7007","command":"run-tests","outputFile":"test_results.json"}'

# Instruction 8: Renommer math.py en math_utils.py
wscat -c ws://localhost:3000 -x '{"requestId":"7007a","command":"execute-command","shellCommand":"mv src/math.py src/math_utils.py"}'

# Instruction 9: Mettre à jour le fichier de test
wscat -c ws://localhost:3000 -x '{"requestId":"7007b","command":"update-files","files":[{"path":"tests/test_math.py","content":"import unittest\nfrom src.math_utils import add\n\nclass TestMath(unittest.TestCase):\n    def test_add(self):\n        self.assertEqual(add(2, 3), 5)\n"}]}'

# Instruction 10: Exécuter les tests (tentative corrigée)
wscat -c ws://localhost:3000 -x '{"requestId":"7007","command":"execute-command","shellCommand":". venv/bin/activate && python3 -m unittest discover tests > test_results.json"}'

# Instruction 11: Committer les modifications
wscat -c ws://localhost:3000 -x '{"requestId":"7008","command":"execute-command","shellCommand":"git add . && git commit -m \"Initial Python project with tests\""}'

# Instruction 12: Pousser les modifications avec PAT
wscat -c ws://localhost:3000 -x '{"requestId":"7009","command":"execute-command","shellCommand":"git push https://venantvr:<ton-token>@github.com/venantvr/Python.VsCode.Interface.git main"}'
