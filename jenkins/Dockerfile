# Jenkins pour JefNet : Jenkins + client Docker (pour construire et lancer les conteneurs du projet)
FROM jenkins/jenkins:lts-jdk21
USER root
COPY --from=docker:27-cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker:27-cli /usr/local/libexec/docker/cli-plugins/docker-compose /usr/local/libexec/docker/cli-plugins/docker-compose
# extensions Jenkins nécessaires au pipeline
RUN jenkins-plugin-cli --plugins git workflow-aggregator credentials-binding pipeline-stage-view timestamper ws-cleanup
USER jenkins
