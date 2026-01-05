import * as vscode from "vscode";
import * as fs from "node:fs";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) { }

  public resolveWebviewView(webView: vscode.WebviewView) {
    this._view = webView;

    webView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, "media")],
    };

    webView.webview.html = this._getHtmlForWebview(webView.webview);

    webView.webview.onDidReceiveMessage(async (data) => {
      if (data.type === "createProject") {
        const { artifactId, language, buildTool, apiType, mcVersion } = data.value;
        vscode.commands.executeCommand('vscraft.createProject', { artifactId, language, buildTool, apiType, mcVersion });
      }

      if (data.type === "onError") {
        vscode.window.showErrorMessage(data.value);
      }

      if (data.type === 'onInfo'){
        await this.fetchPaper(webView.webview);
      }
    });
  }

  private async fetchPaper(webview: vscode.Webview): Promise<void> {
    try {
      const response = await fetch("https://api.papermc.io/v2/projects/paper");
      const data = await response.json() as any;

      const versions = data.versions.reverse();


      webview.postMessage({
        type: "updateVersions",
        value: versions
      });
    } catch (error) {
      console.error(error);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "global.css"));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "script.js"));
    const htmlPath = vscode.Uri.joinPath(this._extensionUri, "media", "sidebar.html");

    let htmlContent = fs.readFileSync(htmlPath.fsPath, "utf-8");

    htmlContent = htmlContent.replace("{{styleUri}}", styleUri.toString());
    htmlContent = htmlContent.replace("{{scriptUri}}", scriptUri.toString());

    return htmlContent;
  }
}