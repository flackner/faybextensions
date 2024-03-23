"use strict";

const vscode = require("vscode");

function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.lookDown', lookDown));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.lookUp', lookUp));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.moveDown', moveDown));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.moveUp', moveUp));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.scrollDown', scrollDown));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.scrollUp', scrollUp));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.scrollFastDown', scrollFastDown));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.scrollFastUp', scrollFastUp));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.placeCursorDown', placeCursorDown));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.placeCursorUp', placeCursorUp));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.placeCursorMiddle', placeCursorMiddle));
}

function lookDown() {
    executeLookOrScrollCommand('down');
}

function lookUp() {
    executeLookOrScrollCommand('up');
}

function moveDown() {
    executeMoveCommand('down');
}

function moveUp() {
    executeMoveCommand('up');
}

function scrollDown() {
    executeSmoothScrollCommand('down');
}

function scrollUp() {
    executeSmoothScrollCommand('up');
}

function scrollFastDown() {
    executeFastScrollCommand('down');
}

function scrollFastUp() {
    executeFastScrollCommand('up');
}

function placeCursorDown() {
    placeCursorElevenLinesFromBottom();
}

function placeCursorUp() {
    placeCursorElevenLinesFromTop();
}

function placeCursorMiddle() {
    placeCursorInMiddleOfPage();
}

function executeLookCommand(direction) {
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

// Variable to track if the next action should be scrolling
let currentOffsetUpSaved;
let currentOffsetDownSaved;

function executeLookOrScrollCommand(direction) {
    const activeTextEditor = vscode.window.activeTextEditor;

    if (activeTextEditor) {
        // test if it's within the visible range
        const start = activeTextEditor.visibleRanges[0].start.line;
        const end = activeTextEditor.visibleRanges[0].end.line;
        const currentLineNumber = activeTextEditor.selection.start.line;
        
        if (currentLineNumber >= start && currentLineNumber <= end) {
            
            let offset = direction === 'down' ? currentLineNumber - start : end - currentLineNumber;
            let offsetSaved = direction === 'down' ? currentOffsetDownSaved : currentOffsetUpSaved;

            if (offset == offsetSaved) {
                executeFastScrollCommand(direction);
            } else {
                executeLookCommand(direction);
                direction === 'down' ? currentOffsetDownSaved = offset : currentOffsetUpSaved = offset;
            }
        } else {
            executeFastScrollCommand(direction);
        }
    } else {
        console.error('No active text editor!');
    }
}

function executeSmoothScrollCommand(direction) {
    const activeTextEditor = vscode.window.activeTextEditor;
    const scrollDistance = vscode.workspace.getConfiguration('faybcontrol').get('scrollDistance');

    if (activeTextEditor) {
        // Initialize a promise chain
        let promiseChain = Promise.resolve();
        let commandToExecute = direction === 'down' ? 'scrollLineDown' : 'scrollLineUp';

        // Use a loop to chain the desired number of scroll commands based on direction
        for (let i = 0; i < scrollDistance; i++) {
            promiseChain = promiseChain.then(() => vscode.commands.executeCommand(commandToExecute));
        }

        // Log when all scrolls are completed
        promiseChain.then(() => {
            console.log(`Completed scrolling ${direction}.`);
        }).catch(err => {
            console.error(`Error during scrolling ${direction}:`, err);
        });

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

function executeFastScrollCommand(direction) {
    const activeTextEditor = vscode.window.activeTextEditor;
    const distance = vscode.workspace.getConfiguration('faybcontrol').get('distance');

    if (activeTextEditor) {
        vscode.commands.executeCommand('editorScroll', {
            to: direction,
            by: "wrappedLine",
            value: distance
        });
    } else {
        console.error('No active text editor!');
    }
}

function placeCursorElevenLinesFromTop() {
    const activeTextEditor = vscode.window.activeTextEditor;

    if (activeTextEditor) {
        // Get the top visible line in the viewport
        const topVisibleLine = activeTextEditor.visibleRanges[0].start.line;

        // Calculate the target line number (11 lines down from the top)
        // Ensure it does not exceed the document's total number of lines
        const targetLineNumber = Math.min(topVisibleLine + 10, activeTextEditor.document.lineCount - 1);

        // Get the target line's text to determine the end character index
        const lineText = activeTextEditor.document.lineAt(targetLineNumber).text;
        const endOfLineCharacter = lineText.length;

        // Create a new position for the cursor at the end of the target line
        const newPosition = new vscode.Position(targetLineNumber, endOfLineCharacter);

        // Set the new cursor position (without selecting anything)
        activeTextEditor.selection = new vscode.Selection(newPosition, newPosition);

        // Scroll to the cursor's new position
        activeTextEditor.revealRange(new vscode.Range(newPosition, newPosition), vscode.TextEditorRevealType.Default);
    } else {
        console.error('No active text editor!');
    }
}

function placeCursorElevenLinesFromBottom() {
    const activeTextEditor = vscode.window.activeTextEditor;

    if (activeTextEditor) {
        // Get the bottom visible line in the viewport
        const bottomVisibleLine = activeTextEditor.visibleRanges[0].end.line;

        // Calculate the target line number (11 lines up from the bottom)
        // Ensure it does not go below the first line of the document
        const targetLineNumber = Math.max(bottomVisibleLine - 11, 0);

        // Get the target line's text to determine the end character index
        const lineText = activeTextEditor.document.lineAt(targetLineNumber).text;
        const endOfLineCharacter = lineText.length;

        // Create a new position for the cursor at the end of the target line
        const newPosition = new vscode.Position(targetLineNumber, endOfLineCharacter);

        // Set the new cursor position (without selecting anything)
        activeTextEditor.selection = new vscode.Selection(newPosition, newPosition);

        // Scroll to the cursor's new position
        activeTextEditor.revealRange(new vscode.Range(newPosition, newPosition), vscode.TextEditorRevealType.Default);
    } else {
        console.error('No active text editor!');
    }
}


function placeCursorInMiddleOfPage() {
    const activeTextEditor = vscode.window.activeTextEditor;

    if (activeTextEditor) {
        // Get the visible range in the viewport
        const visibleRange = activeTextEditor.visibleRanges[0];

        // Calculate the middle line number in the visible range
        const middleLineNumber = Math.floor((visibleRange.start.line + visibleRange.end.line) / 2);

        // Here, you might want to adjust the position within the line. This example sets it to the start of the line.
        const characterPosition = 0; // Change this based on where you want the cursor within the line

        // Create a new position for the cursor
        const newPosition = new vscode.Position(middleLineNumber, characterPosition);

        // Set the new cursor position without selecting anything
        activeTextEditor.selection = new vscode.Selection(newPosition, newPosition);

        // Do NOT call revealRange to ensure the viewport remains steady
    } else {
        console.error('No active text editor!');
    }
}

exports.activate = activate;
exports.deactivate = () => { };
