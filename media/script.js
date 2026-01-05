// 1. ELIMINADA la línea de require("os"). Eso no existe en el frontend.

const vscode = acquireVsCodeApi();

window.addEventListener('load', () => load());

function load() {
    const btnCreate = document.getElementById("btnCreate");
    vscode.postMessage({ type: "onInfo", value: "Ready" });

    window.addEventListener('message', (event) => {
        const message = event.data;

        if (message.type === 'updateVersions') {
            updateVersionsSelect(message.value);        
        }
    });

    btnCreate?.addEventListener('click', () => {
        const artifactId = document.getElementById('pluginName').value;
        const buildTool = document.getElementById('buildTool').value;
        const apiType = document.getElementById('apiType').value;
        const mcVersion = document.getElementById('minecraftVersions').value;
        const lang = document.getElementById('language').value;

        if (!artifactId) {
            vscode.postMessage({
                type: 'onError',
                value: 'The artifact name is required ❌'
            });
            return;
        }
        vscode.postMessage({
            type: 'createProject',
            value: {
                artifactId: artifactId,
                buildTool: buildTool,
                apiType: apiType,
                mcVersion: mcVersion,
                language: lang
            }
        });
    });
}

const updateVersionsSelect = (versions) => {
    const select = document.getElementById('minecraftVersions');
    
    if (!select) {return;}

    select.innerHTML = '';

    versions.forEach(version => {
        const option = document.createElement('option');
        option.value = version;
        option.innerText = version;
        select.appendChild(option);
    });

    if (versions.length > 0) {
        select.selectedIndex = 0;
    }
};