# Dockerfile pour le worker d'initialisation des bases de données
# Utilise PostgreSQL client pour créer delivery_db et petri_db

FROM postgres:15-alpine

# Installer bash pour le script
RUN apk add --no-cache bash

# Copier le script d'initialisation
COPY init-databases.sh /usr/local/bin/init-databases.sh

# Rendre le script exécutable
RUN chmod +x /usr/local/bin/init-databases.sh

# Point d'entrée: exécuter le script puis arrêter (worker one-time job)
ENTRYPOINT ["/usr/local/bin/init-databases.sh"]
