import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SidebarProvider } from './provider/SidebarProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Vscraft has been activated');
    const sidebarProvider = new SidebarProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            "vscraft-sidebar-view",
            sidebarProvider
        )
    );

    const createCommand = vscode.commands.registerCommand('vscraft.createProject', async (data) => {
        if (!data) {
            return;
        }

        await createProjectLogic(data);
    });

    context.subscriptions.push(createCommand);
}

export function deactivate() { }

async function createProjectLogic(data: any): Promise<void> {
    const { artifactId, buildTool, apiType, mcVersion } = data;

    const folderSelection = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        openLabel: "Select Destination Directory"
    });

    if (!folderSelection || folderSelection.length === 0) {
        return;
    }
    const location = folderSelection[0].fsPath;

    const groupID = await vscode.window.showInputBox({
        prompt: "Group ID (Package)",
        placeHolder: "Ej: me.usuario.plugin",
        value: `me.example.${artifactId.toLowerCase()}`
    });

    if (!groupID) { return; }

    const root = path.join(location, artifactId);
    const packagePath = groupID.replace(/\./g, path.sep);
    const javaSrcPath = path.join(root, 'src', 'main', 'java', packagePath);
    const resourcesPath = path.join(root, 'src', 'main', 'resources');

    try {
        if (fs.existsSync(root)) {
            vscode.window.showErrorMessage(`❌ The directory "${artifactId}" already exists inside that folder.`);
            return;
        }

        fs.mkdirSync(javaSrcPath, { recursive: true });
        fs.mkdirSync(resourcesPath, { recursive: true });

        const mainClass = `${groupID}.${artifactId}`;
        const pluginYmlContent = `name: ${artifactId}
version: 1.0-SNAPSHOT
main: ${mainClass}
api-version: 1.20
description: Creado con VSCraft
commands:
`;
        fs.writeFileSync(path.join(resourcesPath, 'plugin.yml'), pluginYmlContent);
        const javaContent = `package ${groupID};

import org.bukkit.plugin.java.JavaPlugin;

public final class ${artifactId} extends JavaPlugin {

    @Override
    public void onEnable() {
        getLogger().info("${artifactId} has been enabled!");
    }

    @Override
    public void onDisable() {
        // Plugin shutdown logic
    }
}
`;
        fs.writeFileSync(path.join(javaSrcPath, `${artifactId}.java`), javaContent);

        if (buildTool === 'Maven') {
            createPOMFile(root, groupID, artifactId, apiType, mcVersion);
        } else {
            createGradleFile(root, groupID, artifactId, apiType, mcVersion);
        }

        const openSelection = await vscode.window.showInformationMessage(
            `✅ Project ${artifactId} created successfully!`,
            "Open in New Window", "Add to Workspace"
        );

        const uri = vscode.Uri.file(root);
        if (openSelection === "Open in New Window") {
            vscode.commands.executeCommand('vscode.openFolder', uri, true);
        } else if (openSelection === "Add to Workspace") {
            vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, 0, { uri: uri });
        }

    } catch (error: any) {
        vscode.window.showErrorMessage("Error creating project: " + error.message);
    }
}


function createPOMFile(root: string, groupID: string, pluginName: string, api: string, version : string) {
    const dependency = api === 'Paper'
        ? `<dependency>
            <groupId>io.papermc.paper</groupId>
            <artifactId>paper-api</artifactId>
            <version>${version}-R0.1-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>`
        : `<dependency>
            <groupId>org.spigotmc</groupId>
            <artifactId>spigot-api</artifactId>
            <version>${version}-R0.1-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>`;

    const repositories = api === 'Paper'
        ? `<repository>
            <id>papermc</id>
            <url>https://repo.papermc.io/repository/maven-public/</url>
        </repository>`
        : `<repository>
            <id>spigotmc-repo</id>
            <url>https://hub.spigotmc.org/nexus/content/repositories/snapshots/</url>
        </repository>`;

    const content = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>${groupID}</groupId>
    <artifactId>${pluginName}</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>jar</packaging>

    <name>${pluginName}</name>

    <properties>
        <java.version>21</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <repositories>
        ${repositories}
    </repositories>

    <dependencies>
        ${dependency}
    </dependencies>
</project>`;

    fs.writeFileSync(path.join(root, 'pom.xml'), content);
}

function createGradleFile(root: string, groupID: string, pluginName: string, api: string, version : string) {
    const repoUrl = api === 'Paper' 
        ? 'https://repo.papermc.io/repository/maven-public/' 
        : 'https://hub.spigotmc.org/nexus/content/repositories/snapshots/';
        
    const dependency = api === 'Paper' 
        ? `compileOnly 'io.papermc.paper:paper-api:${version}-R0.1-SNAPSHOT'`
        : `compileOnly 'org.spigotmc:spigot-api:${version}-R0.1-SNAPSHOT'`;

    const content = `plugins {
    id 'java'
}

group = '${groupID}'
version = '1.0-SNAPSHOT'

repositories {
    mavenCentral()
    maven {
        name = '${api}MC'
        url = uri('${repoUrl}')
    }
}

dependencies {
    ${dependency}
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}
`;
    fs.writeFileSync(path.join(root, 'build.gradle'), content);
    fs.writeFileSync(path.join(root, 'settings.gradle'), `rootProject.name = '${pluginName}'`);
}