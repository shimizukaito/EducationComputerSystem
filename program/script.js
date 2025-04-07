document.addEventListener("DOMContentLoaded", function () {
    const consoleOutput = document.getElementById("consoleOutput");
    const codeEditor = document.getElementById("codeEditor");
    const runButton = document.getElementById("runButton");
    const lineNumbers = document.getElementById("lineNumbers");

    function customPrint(message, isError = false) {
        const output = isError ? `<span class="error">${message}</span>` : message;
        consoleOutput.innerHTML += output + "\n";
    }

    function runJavaScriptCode() {
        const code = codeEditor.value;
        consoleOutput.textContent = "";
        try {
            const result = eval(code);
            if (result !== undefined) {
                customPrint(result);
            }
        } catch (e) {
            customPrint("エラー：" + e.message, true);
        }
    }

    function updateLineNumbers() {
        const lines = codeEditor.value.split('\n');
        lineNumbers.textContent = Array.from({ length: lines.length }, (_, i) => i + 1).join('\n');
    }

    function syncScroll() {
        lineNumbers.scrollTop = codeEditor.scrollTop;
    }

    function handleTab(event) {
        if (event.key === "Tab") {
            event.preventDefault();
            const start = codeEditor.selectionStart;
            const end = codeEditor.selectionEnd;
            codeEditor.value = codeEditor.value.substring(0, start) + "\t" + codeEditor.value.substring(end);
            codeEditor.selectionStart = codeEditor.selectionEnd = start + 1;
            updateLineNumbers();
        }
    }

    // バインドイベント
    runButton.addEventListener("click", runJavaScriptCode);
    codeEditor.addEventListener("input", updateLineNumbers);
    codeEditor.addEventListener("scroll", syncScroll);
    codeEditor.addEventListener("keydown", handleTab);

    // 初期化
    updateLineNumbers();
});
