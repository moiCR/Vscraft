import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SidebarProvider } from './provider/SidebarProvider';
import { JavaBuilder } from './builder/type/JavaBuilder';
import { ProjectBuilder } from './builder/ProjectBuilder';

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
        if (!data) { return; }
        await createProject(data);
    });

    context.subscriptions.push(createCommand);
}

export function deactivate() { }

async function createProject(data: any): Promise<void> {
    const { artifactId, language, buildTool, apiType, mcVersion } = data;

    const folderSelection = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        openLabel: "Select Destination Directory"
    });

    if (!folderSelection || folderSelection.length === 0) { return; }

    const location = folderSelection[0].fsPath;

    const groupID = await vscode.window.showInputBox({
        prompt: "Group ID (Package)",
        placeHolder: "Ej: dev.example.plugin",
        value: `dev.example.${artifactId.toLowerCase()}`
    });

    if (!groupID) { return; }

    const root = path.join(location, artifactId);

    try {
        if (!fs.existsSync(root)) {
            fs.mkdirSync(root, { recursive: true });
        }

        let builder: ProjectBuilder;

        switch (language) {
            case 'Java':
                builder = new JavaBuilder();
                break;
            default:
                vscode.window.showErrorMessage("Language not supported yet");
                return;
        }

        if (!builder) {
            vscode.window.showErrorMessage("Failed to initialize project builder");
            return;
        }

        switch (buildTool) {
            case 'Maven':
                builder.createPOMFile(extensionRoot, root, groupID, artifactId, apiType, mcVersion);
                break;
            case 'Gradle':
                builder.createGradleFiles(extensionRoot, root, groupID, artifactId, apiType, mcVersion);
                break;
        }

        builder.createDirectories(root);
        builder.createMainClass(extensionRoot, root, groupID, artifactId);
        builder.createPluginYML(extensionRoot, root, groupID, artifactId, apiType, mcVersion);

        
        vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(root), true);

    } catch (error: any) {
        vscode.window.showErrorMessage("Error creating project: " + error.message);
    }
}


