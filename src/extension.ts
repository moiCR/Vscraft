import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SidebarProvider } from './provider/SidebarProvider';

let extensionRoot: string;

export function activate(context: vscode.ExtensionContext) {
    console.log('Vscraft has been activated');
    extensionRoot = context.extensionPath;

    const sidebarProvider = new SidebarProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            "vscraft-sidebar-view",
            sidebarProvider
        )
    );

    const createCommand = vscode.commands.registerCommand('vscraft.createProject', async (data) => {
        if (!data) {return;}
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

    if (!folderSelection || folderSelection.length === 0) {return;}
    
    const location = folderSelection[0].fsPath;

    const groupID = await vscode.window.showInputBox({
        prompt: "Group ID (Package)",
        placeHolder: "Ej: me.usuario.plugin",
        value: `me.example.${artifactId.toLowerCase()}`
    });

    if (!groupID) {return;}

    const root = path.join(location, artifactId);

    try {
        if (!fs.existsSync(root)) {
            fs.mkdirSync(root, { recursive: true });
        }

        createJavaClass(root, groupID, artifactId);
        createPluginYml(root, groupID, artifactId, apiType, mcVersion);

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

function createPluginYml(root: string, groupID: string, pluginName: string, api: string, version: string){
    const variables = {
        'NAME': pluginName,
        'VERSION': "1.0-SNAPSHOT",
        'MAIN_CLASS': `${groupID}.${pluginName}`,
        'API_VERSION': version,
    };

    try{
        let templateContent = fs.readFileSync(path.join(extensionRoot, 'resources', 'template_plugin.yml'), 'utf8');

        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            templateContent = templateContent.replace(regex, value);
        });

        const resourcesPath = path.join(root, 'src', 'main', 'resources');
        
        if (!fs.existsSync(resourcesPath)) {
            fs.mkdirSync(resourcesPath, { recursive: true });
        }

        fs.writeFileSync(path.join(resourcesPath, 'plugin.yml'), templateContent);
    }catch(error){
        throw new Error("Plugin YML: " + error);
    }
}

function createJavaClass(root: string, groupID: string, pluginName: string){
    const variables = {
        'PACKAGE': groupID,
        'CLASS_NAME': pluginName
    };

    const packagePath = groupID.replace(/\./g, path.sep);
    
    const javaFullPath = path.join(root, 'src', 'main', 'java', packagePath);

    try{
        let templateContent = fs.readFileSync(path.join(extensionRoot, 'resources', 'template_main.java'), 'utf8');

        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            templateContent = templateContent.replace(regex, value);
        });

        if (!fs.existsSync(javaFullPath)) {
            fs.mkdirSync(javaFullPath, { recursive: true });
        }

        fs.writeFileSync(path.join(javaFullPath, `${pluginName}.java`), templateContent);
    }catch(error){
        throw new Error("Java Class: " + error);
    }
}

function createPOMFile(root: string, groupID: string, pluginName: string, api: string, version: string) {
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

    try{
        let templateContent = fs.readFileSync(path.join(extensionRoot, 'resources', 'template_pom.xml'), 'utf8');

        Object.entries(variables).forEach(([key, value]) => {
            const safeKey = key.replace(/\./g, '\\.');
            const regex = new RegExp(`{{${safeKey}}}`, 'g');
            templateContent = templateContent.replace(regex, value);
        });

        fs.writeFileSync(path.join(root, 'pom.xml'), templateContent);
    }catch(error){
        throw new Error("POM File: " + error);
    }
}

function createGradleFile(root: string, groupID: string, pluginName: string, api: string, version: string) {

}