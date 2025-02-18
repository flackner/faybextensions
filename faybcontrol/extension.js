
const vscode = require("vscode");

let scrollInterval = null;
let lastScrollDirection = null;

function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.lookDown', () => look('down')));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.lookUp', () => look('up')));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.moveDown', () => move('down')));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.moveUp', () => move('up')));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.scrollDown', () => scroll('down')));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.scrollUp', () => scroll('up')));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.scrollFastDown', () => fastScroll('down')));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.scrollFastUp', () => fastScroll('up')));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.placeCursorDown', () => placeCursorRelative('bottom', 11)));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.placeCursorUp', () => placeCursorRelative('top', 11)));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.placeCursorMiddle', () => placeCursorMiddle()));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.moveCursorConditionalUp', () => moveCursorConditional("up", 3)));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.moveCursorConditionalDown', () => moveCursorConditional("down", 3)));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.startScrollDown', () => startScrolling('down')));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.startScrollUp', () => startScrolling('up')));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.stopScrolling', () => stopScrolling()));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.selectLineWithPreviousBreakDown', () => selectLineWithPreviousBreakDown()));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.selectLineWithPreviousBreakUp', () => selectLineWithPreviousBreakUp()));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.revealCellAtTop', () => revealCellAtTop()));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.revealCellInCenter', () => revealCellInCenter()));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.cellScrollUp', () => cellScrollUp()));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.cellScrollDown', () => cellScrollDown()));
    context.subscriptions.push(vscode.commands.registerCommand('faybcontrol.selectCellAtTop', () => selectCellAtTop()));
}

function look(direction) {
    const activeTextEditor = vscode.window.activeTextEditor;
    const offset = vscode.workspace.getConfiguration('faybcontrol').get('offset');

    if (activeTextEditor) {
        const currentLineNumber = activeTextEditor.selection.start.line;
        const lineNumber = direction === 'down' ? currentLineNumber - offset : currentLineNumber + offset;
        const at = direction === 'down' ? 'top' : 'bottom';

        vscode.commands.executeCommand('revealLine', { lineNumber, at })
            .then(() => console.log(`Looked ${direction}`), console.error);
    } else {
        console.error('No active text editor!');
    }
}

let currentOffsetUpSaved, currentOffsetDownSaved;

function lookOrScroll(direction) {
    const activeTextEditor = vscode.window.activeTextEditor;

    if (activeTextEditor) {
        const { start, end } = activeTextEditor.visibleRanges[0];
        const currentLineNumber = activeTextEditor.selection.start.line;
        const offset = direction === 'down' ? currentLineNumber - start.line : end.line - currentLineNumber;
        const offsetSaved = direction === 'down' ? currentOffsetDownSaved : currentOffsetUpSaved;

        if (currentLineNumber >= start.line && currentLineNumber <= end.line) {
            if (offset === offsetSaved) {
                fastScroll(direction);
            } else {
                look(direction);
                if (direction === 'down') currentOffsetDownSaved = offset;
                else currentOffsetUpSaved = offset;
            }
        } else {
            fastScroll(direction);
        }
    } else {
        console.error('No active text editor!');
    }
}

function scroll(direction) {
    const activeTextEditor = vscode.window.activeTextEditor;
    const scrollDistance = vscode.workspace.getConfiguration('faybcontrol').get('scrollDistance');

    if (activeTextEditor) {
        let command = direction === 'down' ? 'scrollLineDown' : 'scrollLineUp';
        let promiseChain = Promise.resolve();

        for (let i = 0; i < scrollDistance; i++) {
            promiseChain = promiseChain.then(() => vscode.commands.executeCommand(command));
        }

        promiseChain.then(() => console.log(`Scrolled ${direction}`)).catch(err => console.error(`Error during scrolling ${direction}:`, err));
    } else {
        console.error('No active text editor!');
    }
}

function fastScroll(direction) {
    const activeTextEditor = vscode.window.activeTextEditor;
    const distance = vscode.workspace.getConfiguration('faybcontrol').get('distance');

    if (activeTextEditor) {
        vscode.commands.executeCommand('editorScroll', {
            to: direction,
            by: "wrappedLine",
            value: distance
        }).then(() => console.log(`Fast scrolled ${direction}`), console.error);
    } else {
        console.error('No active text editor!');
    }
}

function move(direction) {
    const activeTextEditor = vscode.window.activeTextEditor;
    const distance = vscode.workspace.getConfiguration('faybcontrol').get('distance');

    if (activeTextEditor) {
        vscode.commands.executeCommand('editorScroll', { to: direction, by: "wrappedLine", value: distance })
            .then(() => vscode.commands.executeCommand('cursorMove', { to: direction, by: "wrappedLine", value: distance }))
            .then(() => console.log(`Moved ${direction}`), console.error);
    } else {
        console.error('No active text editor!');
    }
}

function placeCursorRelative(position, offset) {
    const activeTextEditor = vscode.window.activeTextEditor;

    if (activeTextEditor) {
        const { start, end } = activeTextEditor.visibleRanges[0];
        const targetLineNumber = position === 'top' ? Math.min(start.line + offset - 1, activeTextEditor.document.lineCount - 1)
            : Math.max(end.line - offset, 0);

        const lineText = activeTextEditor.document.lineAt(targetLineNumber).text;
        const endOfLineCharacter = lineText.length;
        const newPosition = new vscode.Position(targetLineNumber, endOfLineCharacter);

        activeTextEditor.selection = new vscode.Selection(newPosition, newPosition);
        activeTextEditor.revealRange(new vscode.Range(newPosition, newPosition), vscode.TextEditorRevealType.Default);

        console.log(`Placed cursor ${position} ${offset} lines`);
    } else {
        console.error('No active text editor!');
    }
}

function placeCursorMiddle() {
    const activeTextEditor = vscode.window.activeTextEditor;

    if (activeTextEditor) {
        const { start, end } = activeTextEditor.visibleRanges[0];

        const middleLineNumber = Math.floor((start.line + end.line) / 2);
        const newPosition = new vscode.Position(middleLineNumber, 0);

        activeTextEditor.selection = new vscode.Selection(newPosition, newPosition);

        console.log('Placed cursor in the middle of the page');
    } else {
        console.error('No active text editor!');
    }
}

function moveCursorConditional(direction, numberOfLines) {
    const activeTextEditor = vscode.window.activeTextEditor;

    if (activeTextEditor) {
        const { start, end } = activeTextEditor.visibleRanges[0];
        const currentLineNumber = activeTextEditor.selection.start.line;

        if (currentLineNumber >= start.line && currentLineNumber <= end.line) {
            const commandArgs = {
                to: direction,
                by: "wrappedLine",
                value: numberOfLines
            };

            vscode.commands.executeCommand('cursorMove', commandArgs);
        } else {
            placeCursorMiddle();
        }
    } else {
        console.error('No active text editor!');
    }
}

let scrollSpeed = 16; // Initial scroll speed (in milliseconds)
let scrollStep = 2; // Initial scroll step (lines per scroll)

function startScrolling(direction) {
    if (scrollInterval) {
        if (lastScrollDirection === direction) {
            // Speed up the scrolling by reducing the interval and increasing the step size
            scrollSpeed = scrollSpeed / 2; // Limit the minimum interval
            scrollStep = scrollStep + 1; // Increase step size
            clearInterval(scrollInterval); // Clear the existing interval
            scrollInterval = setInterval(() => {
                vscode.commands.executeCommand('editorScroll', {
                    to: direction,
                    by: "wrappedLine",
                    value: scrollStep
                });
            }, scrollSpeed);
        } else {
            // Stop scrolling if the direction changes
            stopScrolling();
            return;
        }
    } else {
        // Start scrolling in the specified direction
        scrollInterval = setInterval(() => {
            vscode.commands.executeCommand('editorScroll', {
                to: direction,
                by: "wrappedLine",
                value: scrollStep
            });
        }, scrollSpeed);
        lastScrollDirection = direction;

        // Stop scrolling when the selection changes (arrow keys, mouse)
        vscode.window.onDidChangeTextEditorSelection(stopScrolling);

        // Stop scrolling when a document change occurs (typing, etc.)
        vscode.workspace.onDidChangeTextDocument(() => {
            stopScrolling();
        });

        // Stop scrolling when the active editor changes (switching tabs)
        vscode.window.onDidChangeActiveTextEditor(() => {
            stopScrolling();
        });
    }
}

function stopScrolling() {
    if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
        scrollSpeed = 16; // Reset to initial speed
        scrollStep = 2;   // Reset to initial step size
        lastScrollDirection = null;
    }
}

function selectLineWithPreviousBreakUp() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    if (selection.isEmpty) {
        vscode.commands.executeCommand('cursorEnd');
        vscode.commands.executeCommand('cursorUpSelect');
        vscode.commands.executeCommand('cursorEndSelect');
    } else {
        vscode.commands.executeCommand('cursorUpSelect');
        vscode.commands.executeCommand('cursorEndSelect');
    }
}

function selectLineWithPreviousBreakDown() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    if (selection.isEmpty) {
        vscode.commands.executeCommand('cursorUp');
        vscode.commands.executeCommand('cursorEnd');
        vscode.commands.executeCommand('cursorDownSelect');
        vscode.commands.executeCommand('cursorEndSelect');
    } else {
        vscode.commands.executeCommand('cursorDownSelect');
        vscode.commands.executeCommand('cursorEndSelect');
    }
}

function revealCellAtTop() {
    const notebookEditor = vscode.window.activeNotebookEditor;
    if (!notebookEditor) {
        return;
    }
    const activeRange = notebookEditor.selections[0];
    notebookEditor.revealRange(activeRange, vscode.NotebookEditorRevealType.AtTop);
}

function revealCellInCenter() {
    const notebookEditor = vscode.window.activeNotebookEditor;
    if (!notebookEditor) {
        return;
    }
    const activeRange = notebookEditor.selections[0];
    notebookEditor.revealRange(activeRange, vscode.NotebookEditorRevealType.InCenter);
}

function cellScrollUp() {
    const notebookEditor = vscode.window.activeNotebookEditor;
    if (!notebookEditor) {
        return;
    }
    const visibleRanges = notebookEditor.visibleRanges[0];
    const targetRange = new vscode.NotebookRange(visibleRanges.start - 1, visibleRanges.start - 1);
    notebookEditor.revealRange(targetRange, vscode.NotebookEditorRevealType.AtTop);
}

function cellScrollDown() {
    const notebookEditor = vscode.window.activeNotebookEditor;
    if (!notebookEditor) {
        return;
    }
    const visibleRanges = notebookEditor.visibleRanges[0];
    const targetRange = new vscode.NotebookRange(visibleRanges.start + 1, visibleRanges.start + 1);
    notebookEditor.revealRange(targetRange, vscode.NotebookEditorRevealType.AtTop);
}

function selectCellAtTop() {
    const notebookEditor = vscode.window.activeNotebookEditor;
    if (!notebookEditor) {
        return;
    }
    const visibleRanges = notebookEditor.visibleRanges;
    if (!visibleRanges || visibleRanges.length === 0) {
        return;
    }
    const firstVisibleRange = visibleRanges[0];
    const firstCellRange = new vscode.NotebookRange(firstVisibleRange.start, firstVisibleRange.start);
    notebookEditor.selections = [firstCellRange];
}

exports.activate = activate;
exports.deactivate = () => { };
