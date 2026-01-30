@echo off
set "SPRING_DATASOURCE_PASSWORD=Jeff@1234"
java -Dliquibase.duplicateFileMode=WARN -cp "src/main/resources;target/optimization-api-0.0.1-SNAPSHOT.jar" org.springframework.boot.loader.launch.JarLauncher
