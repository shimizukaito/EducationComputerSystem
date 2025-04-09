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
    try:
        exec(code)  # 一括実行することでスコープを共有
    except Exception as e:
        print(f"エラー：{str(e)}", error=True)

def update_line_numbers(event):
    editor = document['codeEditor']
    lines = editor.value.split('\n')
    document['lineNumbers'].text = '\n'.join(str(i + 1) for i in range(len(lines)))

def sync_scroll(event):
    document['lineNumbers'].scrollTop = document['codeEditor'].scrollTop

def handle_tab(event):
    if event.key == "Tab":
        event.preventDefault()
        editor = document['codeEditor']
        start = editor.selectionStart
        end = editor.selectionEnd
        editor.value = editor.value[:start] + "\t" + editor.value[end:]
        editor.selectionStart = editor.selectionEnd = start + 1
        update_line_numbers(event)

# バインド処理
document['runButton'].bind('click', run_python_code)
editor = document['codeEditor']
editor.bind('input', update_line_numbers)
editor.bind('scroll', sync_scroll)
editor.bind('keydown', handle_tab)

# 初期化
update_line_numbers(None)
