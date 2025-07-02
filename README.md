<p align="center">
<img src="https://user-images.githubusercontent.com/4563971/120888136-049e2880-c5f7-11eb-81bd-25706d1944a2.png" alt="Student Gaming Network" />
</p>

<p align="center">
<b>Student Gaming Network</b>
</p>

---

# Le SGN

Le Student Gaming Network (SGN) est la fédération des associations étudiantes françaises d'esport. À l'initiative des
associations étudiantes de nouvelles technologies et de jeux vidéo, le SGN, association loi 1901 à but non lucratif, a été fondé en 2015.

# La plateforme

La plateforme du SGN est open source, de sorte que n'importe quel étudiant peut voir son code source et y contribuer.
Le but est de pouvoir apprendre et s'améliorer en développement web, tout en contribuant à un projet moderne et fun !

## Contribution

Pour pouvoir contribuer au développement, vous devez faire partie de l'équipe technique du SGN.

Voici les étapes pour développer une feature ou régler un bug:

- Créer une issue décrivant le problème/la fonctionnalité de façon précise mais concise
- Créer une branche nommée `dev-[numéro de l'issue]` et faites vos commit dessus
- Créer une pull request en mettant au début de la description `resolve #[numéro de l'issue]`
- Une fois la review effectuée, merger votre branche en faisant un "Squash and merge"

# SGN Discord Reaction Role Bot

Bot Discord modulaire en TypeScript permettant de gérer des rôles à réaction par salon, avec support des emojis custom, gestion de la whitelist (utilisateurs et rôles), et configuration MongoDB.

## Fonctionnalités principales

- Module Role manager :
  - Ajout, suppression, modification de rôles à réaction via commandes slash
  - Un embed de rôles à réaction par salon, personnalisable (titre, description)
  - Support des emojis Unicode **et** custom du serveur
  - Permissions avancées (seuls les whitelistés ou owner peuvent gérer)

- Gestion de la whitelist (utilisateurs et rôles) via commandes
- Stockage MongoDB (rôles, messages, whitelist)

## Installation

1. **Cloner le repo**
2. **Installer les dépendances**
   ```bash
   pnpm install
   ```
3. **Configurer le bot**

   - Créer un fichier `.env` à la racine en copiant le fichoer `.env.example`
   - [Créer une application et un bot sur le portail Discord](https://discord.com/developers/applications)
   - Activer les intents "Server Members" et "Message Content" dans l'onglet Bot
   - Inviter le bot sur votre serveur avec les permissions nécessaires (voir plus bas)

4. **Compiler le projet**

   ```bash
   pnpm run build
   ```

5. **Lancer le bot**
   ```bash
   pnpm start
   ```

## Permissions à donner au bot

- Gérer les rôles
- Gérer les messages
- Ajouter des réactions
- Lire les messages, envoyer des messages, lire l'historique
- Voir les salons

## Commandes principales

- `/addrole emoji rôle [description]` : Ajoute un rôle à réaction (emoji unicode ou custom du serveur uniquement)
- `/removerole rôle` : Retire un rôle à réaction
- `/editrole rôle [emoji] [description]` : Modifie l'emoji ou la description d'un rôle à réaction
- `/setupreactionroles [title] [description]` : Crée ou met à jour l'embed des rôles à réaction dans le salon courant
- `/whitelistuser add|remove @user1 [@user2 ...]` : Ajoute/retire des utilisateurs à la whitelist
- `/whitelistrole add|remove @role1 [@role2 ...]` : Ajoute/retire des rôles à la whitelist
- `/whitelistshow` : Affiche la liste des utilisateurs et rôles whitelistés

## Personnalisation

- Un embed de rôles à réaction **par salon**
- Titre et description de l'embed personnalisables via `/setupreactionroles`

## Sécurité

- Seuls les utilisateurs/rôles whitelistés ou le propriétaire du serveur peuvent gérer les rôles à réaction
- Les emojis custom doivent appartenir au serveur courant

## Développement

- Utilisation de TypeScript, pnpm, mongoose, discord.js
- Alias d'imports pour les modèles : `@models/xxx`
- Compilation dans le dossier `out`

## Déploiement

- Pour la prod, utiliser `NODE_ENV=production` (commandes slash globales, propagation plus lente)
- Pour la dev, utiliser `NODE_ENV=development` et `GUILD_ID` (commandes instantanées sur le serveur de test)

---

**Pour toute question ou amélioration, ouvrez une issue ou contactez le mainteneur !**
