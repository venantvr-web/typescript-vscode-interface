# Automatisez votre Workflow de Développement avec une Interface WebSocket pour VS Code

Cette extension pour Visual Studio Code transforme votre éditeur en un puissant serveur d'automatisation. Elle expose une interface WebSocket sécurisée qui permet à des outils externes ou des scripts d'interagir avec votre espace de travail pour exécuter des commandes shell et manipuler le système de fichiers de manière programmatique.

Idéal pour l'intégration continue, le scripting de tâches complexes ou la gestion de projets à distance, cet outil offre un contrôle total sur votre environnement de développement via un simple protocole JSON.

## Fonctionnalités Clés

  * **Serveur WebSocket pour Commandes à Distance** : Démarre un serveur WebSocket qui écoute les instructions JSON, permettant de piloter VS Code depuis n'importe quel client compatible. (implémenté dans `src/extension.ts`)
  * **Exécution de Commandes dans un Shell Persistant** : Exécute des commandes shell (`execute-command`) dans un unique processus bash persistant. Cela garantit que les variables d'environnement (comme `PYTHONPATH`) et le contexte sont conservés entre les commandes. (implémenté dans `src/task-runner.ts`)
  * **Gestion Complète du Système de Fichiers** : Offre un ensemble riche de commandes pour manipuler les fichiers et les répertoires : créer, lire, lister, mettre à jour, patcher (texte/JSON), supprimer, copier, déplacer et renommer. (implémenté dans `src/file-writer.ts` et `src/file-reader.ts`)
  * **Traitement Séquentiel et Fiable des Requêtes** : Utilise une file d'attente pour traiter les messages un par un, assurant ainsi que les opérations, notamment sur les fichiers, s'exécutent de manière ordonnée et sans conflits. (implémenté dans `src/extension.ts`)

## Comment ça marche ?

Le workflow est simple : une fois l'extension activée, un client externe se connecte au serveur WebSocket et envoie des requêtes JSON pour effectuer des actions dans le workspace de VS Code.

1.  **Lancement** : L'extension est activée dans VS Code, démarrant le serveur WebSocket sur le port `3000`.
2.  **Connexion** : Un client (par exemple, un script ou l'outil `wscat`) se connecte à `ws://localhost:3000`.
3.  **Envoi d'une Commande** : Le client envoie un message JSON structuré contenant un identifiant unique (`requestId`) et la commande à exécuter.
4.  **Réception d'une Réponse** : Le serveur exécute la tâche et retourne une réponse JSON contenant le même `requestId` et le résultat de l'opération.

### Format des Requêtes et Réponses

Voici un exemple pour la création d'un fichier :

**Requête du client :**

```json
{
  "requestId": "req-12345",
  "command": "create-file",
  "filePath": "src/nouveau_module.js",
  "content": "console.log('Hello, World!');"
}
```

**Réponse du serveur :**

```json
{
  "status": "success",
  "message": "Fichier créé: src/nouveau_module.js",
  "requestId": "req-12345"
}
```

## Installation

1.  Clonez ce dépôt sur votre machine locale.
2.  Ouvrez le répertoire du projet dans Visual Studio Code.
3.  Installez les dépendances du projet via le terminal :
    ```bash
    npm install
    ```
4.  Appuyez sur `F5` (ou allez dans le menu `Exécuter > Démarrer le débogage`).
5.  Une nouvelle fenêtre de VS Code "[Extension Development Host]" s'ouvrira avec l'extension activée et le serveur WebSocket en écoute.

## Prérequis

  * **Node.js** : Version 18.x ou supérieure.
  * **npm** : Le gestionnaire de paquets de Node.js.
  * **Visual Studio Code** : Pour lancer et déboguer l'extension.
  * **(Optionnel) wscat** : Un outil en ligne de commande pratique pour tester la communication WebSocket.
    ```bash
    npm install -g wscat
    ```
## Licence

Ce projet est sous licence **MIT**.

## Stack

[![Stack](https://skillicons.dev/icons?i=ts,vscode,nodejs&theme=dark)](https://skillicons.dev)
