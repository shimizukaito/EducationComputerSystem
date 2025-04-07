from browser import document

console_output = document['consoleOutput']

def custom_print(*args, sep=' ', end='\n', error=False):
    output = sep.join(map(str, args)) + end
    if error:
        console_output.innerHTML += f'<span class="error">{output}</span>'
    else:
        console_output.text += output

print = custom_print

def run_python_code(event):
    code = document['codeEditor'].value
    console_output.text = ""
    lines = code.split('\n')

    for line_number, line in enumerate(lines, start=1):
        if line.strip() == "":
            continue
        try:
            exec(line)
        except Exception as e:
            error_message = f"エラー：{str(e)} (行: {line_number})"
            print(error_message, error=True)

run_button = document['runButton']
run_button.bind('click', run_python_code)

def update_line_numbers(event):
    editor = document['codeEditor']
    lines = editor.value.split('\n')
    line_count = len(lines)
    line_numbers = '\n'.join(str(i + 1) for i in range(line_count))
    document['lineNumbers'].text = line_numbers

def sync_scroll(event):
    line_numbers = document['lineNumbers']
    code_editor = document['codeEditor']
    line_numbers.scrollTop = code_editor.scrollTop

def adjust_height():
    code_editor = document['codeEditor']
    line_numbers = document['lineNumbers']
    # エディタと行番号の高さを合わせる
    line_numbers.style.height = f"{code_editor.scrollHeight}px"

def handle_tab(event):
    if event.key == "Tab":
        event.preventDefault()
        editor = document['codeEditor']
        start = editor.selectionStart
        end = editor.selectionEnd
        indent = "\t"
        value = editor.value
        editor.value = value[:start] + indent + value[end:]
        editor.selectionStart = editor.selectionEnd = start + len(indent)
        update_line_numbers(event)

code_editor = document['codeEditor']
code_editor.bind('input', update_line_numbers)
code_editor.bind('scroll', sync_scroll)
code_editor.bind('keydown', handle_tab)

# 初期化時に高さを調整
adjust_height()
