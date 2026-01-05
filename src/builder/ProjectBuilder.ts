import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export abstract class ProjectBuilder {


    createDirectories(root: string): void {
        const resourcesPath = path.join(root, 'src', 'main', 'resources');

        if (!fs.existsSync(resourcesPath)) {
            fs.mkdirSync(resourcesPath, { recursive: true });
        }
    }

    createPluginYML(extensionRoot: string, root: string, groupID: string, pluginName: string, api: string, version: string): void {
        const variables = {
            'NAME': pluginName,
            'VERSION': "1.0-SNAPSHOT",
            'MAIN_CLASS': `${groupID}.${pluginName}`,
            'API_VERSION': version,
        };

        try {
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
        } catch (error) {
            vscode.window.showErrorMessage("Error creating plugin.yml: " + error);
        }
    }

    abstract createMainClass(extensionRoot: string, root: string, groupID: string, pluginName: string): void;
    abstract createPOMFile(extensionRoot: string, root: string, groupID: string, pluginName: string, api: string, version: string): void;
    abstract createGradleFiles(extensionRoot: string, root: string, groupID: string, pluginName: string, api: string, version: string): void;
}