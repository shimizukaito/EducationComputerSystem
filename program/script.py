from browser import document, window, html

STORAGE_PREFIX = "pyprog:"
console_output = document['consoleOutput']
file_input = document['filenameInput']
editor = document['codeEditor']
file_list = document['savedFiles']

def custom_print(*args, sep=' ', end='\n', error=False):
    output = sep.join(map(str, args)) + end
    if error:
        console_output.innerHTML += f'<span class="error">{output}</span>'
    else:
        console_output.text += output
print = custom_print

def run_python_code(event):
    code = editor.value
    console_output.text = ""
    name = file_input.value.strip()

    if name and window.localStorage.getItem(STORAGE_PREFIX + name) is not None:
        window.localStorage.setItem(STORAGE_PREFIX + name, code)
        print(f"'{name}' を上書き保存しました")

    try:
        exec(code)
    except Exception as e:
        print(f"エラー：{str(e)}", error=True)

def save_code_to_storage(event=None):
    name = file_input.value.strip()
    if not name:
        print("エラー：ファイル名を入力してください", error=True)
        return
    window.localStorage.setItem(STORAGE_PREFIX + name, editor.value)
    print(f"'{name}' を保存しました")
    refresh_file_list()

def load_code_from_storage(name):
    code = window.localStorage.getItem(STORAGE_PREFIX + name)
    if code is not None:
        editor.value = code
        file_input.value = name
        update_line_numbers(None)
        print(f"'{name}' を読み込みました")

def delete_selected_file(event=None):
    name = file_input.value.strip()
    if not name:
        print("エラー：削除するファイル名を入力または選択してください", error=True)
        return
    key = STORAGE_PREFIX + name
    if window.localStorage.getItem(key) is None:
        print(f"エラー：'{name}' は存在しません", error=True)
        return
    if not window.confirm(f"'{name}' を本当に削除しますか？"):
        return
    window.localStorage.removeItem(key)
    file_input.value = ""
    editor.value = ""
    document['lineNumbers'].text = "1"
    console_output.text = ""
    print(f"'{name}' を削除しました")
    refresh_file_list()

def refresh_file_list():
    file_list.clear()
    for i in range(window.localStorage.length):
        key = window.localStorage.key(i)
        if key.startswith(STORAGE_PREFIX):
            name = key[len(STORAGE_PREFIX):]
            li = html.LI(name)
            li.attrs['data-name'] = name
            li.bind('click', lambda ev, name=name: load_code_from_storage(name))
            li.bind('dblclick', rename_file_prompt)
            file_list <= li

def rename_file_prompt(event):
    li = event.currentTarget
    old_name = li.attrs['data-name']
    input_box = html.INPUT(type="text", value=old_name)
    input_box.style.width = "100%"

    def confirm_rename(ev):
        new_name = input_box.value.strip()
        if new_name and new_name != old_name:
            old_key = STORAGE_PREFIX + old_name
            new_key = STORAGE_PREFIX + new_name
            code = window.localStorage.getItem(old_key)
            if window.localStorage.getItem(new_key) is not None:
                print(f"エラー：'{new_name}' はすでに存在します", error=True)
                refresh_file_list()
                return
            window.localStorage.setItem(new_key, code)
            window.localStorage.removeItem(old_key)
            print(f"'{old_name}' を '{new_name}' に変更しました")
        refresh_file_list()

    input_box.bind('keydown', lambda ev: confirm_rename(ev) if ev.key == "Enter" else None)
    li.clear()
    li <= input_box
    input_box.focus()

def update_line_numbers(event):
    lines = editor.value.split('\n')
    document['lineNumbers'].text = '\n'.join(str(i + 1) for i in range(len(lines)))

def sync_scroll(event):
    document['lineNumbers'].scrollTop = editor.scrollTop

def handle_tab(event):
    if event.key == "Tab":
        event.preventDefault()
        start = editor.selectionStart
        end = editor.selectionEnd
        editor.value = editor.value[:start] + "\t" + editor.value[end:]
        editor.selectionStart = editor.selectionEnd = start + 1
        update_line_numbers(event)

document['runButton'].bind('click', run_python_code)
document['saveButton'].bind('click', save_code_to_storage)
document['deleteButton'].bind('click', delete_selected_file)
editor.bind('input', update_line_numbers)
editor.bind('scroll', sync_scroll)
editor.bind('keydown', handle_tab)

refresh_file_list()
update_line_numbers(None)
