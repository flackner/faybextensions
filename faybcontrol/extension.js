"use strict";

const vscode = require("vscode");

function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.lookDown', lookDown));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.lookUp', lookUp));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.moveDown', moveDown));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.moveUp', moveUp));
}

function lookDown() {
    executeScrollCommand('down');
}

function lookUp() {
    executeScrollCommand('up');
}

function moveDown() {
    executeMoveCommand('down');
}

function moveUp() {
    executeMoveCommand('up');
}

function executeScrollCommand(direction) {
    const activeTextEditor = vscode.window.activeTextEditor;
    const offset = vscode.workspace.getConfiguration('faybcontrol').get('offset');

    if (activeTextEditor) {
        const currentLineNumber = activeTextEditor.selection.start.line;
        const lineNumber = direction === 'down' ? currentLineNumber - offset : currentLineNumber + offset;
        const at = direction === 'down' ? 'top' : 'bottom';

        vscode.commands.executeCommand('revealLine', {
            lineNumber: lineNumber,
            at: at,
        }).then(() => console.log('Scrolled'), console.error);
    } else {
        console.error('No active text editor!');
    }
}

function executeMoveCommand(direction) {
    const activeTextEditor = vscode.window.activeTextEditor;
    const distance = vscode.workspace.getConfiguration('faybcontrol').get('distance');

    if (activeTextEditor) {
        vscode.commands.executeCommand('editorScroll', {
            to: direction,
            by: "wrappedLine",
            value: distance
        }).then(() => {
            return vscode.commands.executeCommand('cursorMove', {
                to: direction,
                by: "wrappedLine",
                value: distance
            });
        }).then(() => console.log('Moved'), console.error);
    } else {
        console.error('No active text editor!');
    }
}

exports.activate = activate;
exports.deactivate = () => {};
