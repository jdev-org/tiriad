# Tiriad

Tiriad est un outil que vous pourrez rendre disponible sur votre site internet. Il vous permettra de voir des informations sur une carte représentées sous forme de points.

Ces points peuvent représenter des points de vente, de distribution ou d'autres informations.

Tiriad est un outil libre (open source). Le code source est disponible gratuitement sans contrainte d'utilisation.


## Les outils

### Rechercher un lieu
Tiriad vous permettra de recherche une ville ou une adresse. Grâce à Nominatim et à la Base d'Adresse Nationale, vous pourrez choisir de rechercher des endroits à l'échelle nationale ou internationale.

Cas d'usage : 
```
  Je recherche où se situe la ville de Perros-Guirec.
```

### Localiser vos adresses
Grâce à un fichier type tableur (csv) qui contiendra toutes les adresses à afficher, Tiriad pourra localiser vos informations adressées. Pour cela, une interface simple est proposée.

Vous pouvez aussi importer autant de fichiers que vous le souhaitez.

Cas d'usage : 
```
  J'ai un fichier qui contient mes clients et leurs adresses. 
  Je peux modifier le nom des colonnes et j'aimerai les afficher sur une carte.
 ```

### Créer votre carte

Les points afficher sur la carte peuvent être sauvegardés ou supprimés de manière permanente. Pendant la consultation, vous pourrez également décider d'afficher ou masquer des informations.

Vous retrouverez donc votre carte comme vous l'avez laissé.

Ces actions sont simples et garantissent une utilisation sans difficulté.

Cas d'utilisation :
```
  Je souhaiterai retrouver sur une carte mes distributeurs et mes clients. 
  De façon autonome, je souhaite mettre à jour ces informations sans dépendre de quelqu'un.
 ```

### Un accés sécurisé

Selon vos besoins, l'accès à Tiriad peut être limité par un login et un mot de passe.

### De quoi avez-vous besoin ?

Tiriad nécessite très peu de ressources. Vous devrez seulement disposer d'une serveur web type Apache ou Nginx.
Les données que vous aurez importées seront sauvegardées sur votre serveur. Aucun lien ou ressource externe n'est nécessaire pour garantir votre indépendance et la bonne sécurité de vos informations.








# Installation

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
