import { ProjectBuilder } from "../ProjectBuilder";
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class JavaBuilder extends ProjectBuilder {

    createDirectories(root: string): void {
        super.createDirectories(root);
        
        const javaPath = path.join(root, 'src', 'main', 'java');
        if (!fs.existsSync(javaPath)) {
            fs.mkdirSync(javaPath, { recursive: true });
        }
    }

    createMainClass(extensionRoot: string, root: string, groupID: string, pluginName: string): void {
        const variables = {
            'PACKAGE': groupID,
            'CLASS_NAME': pluginName
        };

        const packagePath = groupID.replace(/\./g, path.sep);
        const javaFullPath = path.join(root, 'src', 'main', 'java', packagePath);

        try {
            let templateContent = fs.readFileSync(path.join(extensionRoot, 'resources', 'template_main.java'), 'utf8');

            Object.entries(variables).forEach(([key, value]) => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                templateContent = templateContent.replace(regex, value);
            });

            if (!fs.existsSync(javaFullPath)) {
                fs.mkdirSync(javaFullPath, { recursive: true });
            }

            fs.writeFileSync(path.join(javaFullPath, `${pluginName}.java`), templateContent);
        } catch (error) {
            vscode.window.showErrorMessage("Java Class: " + error);
        }
    }

    createPOMFile(extensionRoot: string, root: string, groupID: string, pluginName: string, api: string, version: string): void {
        const dependencyGroupId = api === 'Paper' ? 'io.papermc.paper' : 'org.spigotmc';
        const dependencyArtifactId = api === 'Paper' ? 'paper-api' : 'spigot-api';
        const repoId = api === 'Paper' ? 'papermc-repo' : 'spigotmc-repo';
        const repoUrl = api === 'Paper' ? 'https://repo.papermc.io/repository/maven-public/' : 'https://hub.spigotmc.org/nexus/content/repositories/snapshots/';

        const variables = {
            'GROUP': groupID,
            'ARTIFACT': pluginName,
            'REPO.ID': repoId,
            'REPO.URL': repoUrl,
            'API.GROUP': dependencyGroupId,
            'API.ARTIFACT': dependencyArtifactId,
            'API.VERSION': version
        };

        try {
            let templateContent = fs.readFileSync(path.join(extensionRoot, 'resources', 'template_pom.xml'), 'utf8');

            Object.entries(variables).forEach(([key, value]) => {
                const safeKey = key.replace(/\./g, '\\.');
                const regex = new RegExp(`{{${safeKey}}}`, 'g');
                templateContent = templateContent.replace(regex, value);
            });

            fs.writeFileSync(path.join(root, 'pom.xml'), templateContent);
            
            vscode.window.showInformationMessage("pom.xml created successfully");
        } catch (error) {
            vscode.window.showErrorMessage("pom.xml: " + error);
        }
    }

    createGradleFiles(extensionRoot: string, root: string, groupID: string, pluginName: string, api: string, version: string): void {
        // TODO: Implement Gradle file creation for Java projects
    }
}