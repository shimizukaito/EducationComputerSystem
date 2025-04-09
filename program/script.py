from browser import document, window, html

STORAGE_PREFIX = "pyprog:"
console_output = document['consoleOutput']
editor = document['codeEditor']
file_list = document['savedFiles']
current_filename = None

def custom_print(*args, sep=' ', end='\n', error=False):
    output = sep.join(map(str, args)) + end
    if error:
        console_output.innerHTML += f'<span class="error">{output}</span>'
    else:
        console_output.text += output
print = custom_print

def run_python_code(event):
    global current_filename
    code = editor.value
    console_output.text = ""

    if current_filename and window.localStorage.getItem(STORAGE_PREFIX + current_filename) is not None:
        window.localStorage.setItem(STORAGE_PREFIX + current_filename, code)
        print(f"'{current_filename}' を上書き保存しました")

    try:
        exec(code)
    except SyntaxError as e:
        print(f"エラー：{e.msg} (行: {e.lineno})", error=True)
    except Exception as e:
        tb = getattr(e, '__traceback__', None)
        lineno = tb.tb_lineno if tb else '?'
        print(f"エラー：{str(e)} (行: {lineno})", error=True)


def save_code_to_storage(event=None):
    global current_filename
    if not current_filename:
        print("エラー：保存するファイルを選択してください", error=True)
        return
    window.localStorage.setItem(STORAGE_PREFIX + current_filename, editor.value)
    print(f"'{current_filename}' を保存しました")
    refresh_file_list()

def load_code_from_storage(name):
    global current_filename
    code = window.localStorage.getItem(STORAGE_PREFIX + name)
    if code is not None:
        editor.value = code
        current_filename = name
        update_line_numbers(None)
        print(f"'{name}' を読み込みました")

def delete_selected_file(event=None):
    global current_filename
    if not current_filename:
        print("エラー：削除するファイルを選択してください", error=True)
        return
    key = STORAGE_PREFIX + current_filename
    if window.localStorage.getItem(key) is None:
        print(f"エラー：'{current_filename}' は存在しません", error=True)
        return
    if not window.confirm(f"'{current_filename}' を本当に削除しますか？"):
        return
    window.localStorage.removeItem(key)
    current_filename = None
    editor.value = ""
    document['lineNumbers'].text = "1"
    console_output.text = ""
    print("ファイルを削除しました")
    refresh_file_list()

def create_new_file(event=None):
    global current_filename
    js_date = window.Date.new()
    name = (
        f"{js_date.getFullYear()}-"
        f"{str(js_date.getMonth() + 1).zfill(2)}-"
        f"{str(js_date.getDate()).zfill(2)}_"
        f"{str(js_date.getHours()).zfill(2)}-"
        f"{str(js_date.getMinutes()).zfill(2)}-"
        f"{str(js_date.getSeconds()).zfill(2)}"
    )
    full_key = STORAGE_PREFIX + name
    window.localStorage.setItem(full_key, "")
    current_filename = name
    editor.value = ""
    console_output.text = ""
    document['lineNumbers'].text = "1"
    print(f"新規ファイル '{name}' を作成しました")
    refresh_file_list()

def refresh_file_list():
    file_list.clear()
    folders = []
    files = []

    for i in range(window.localStorage.length):
        key = window.localStorage.key(i)
        if key.startswith("pyprogdir:"):
            folders.append(key[len("pyprogdir:"):])
        elif key.startswith(STORAGE_PREFIX):
            files.append(key[len(STORAGE_PREFIX):])

    for folder in sorted(folders):
        li = html.LI(f"📁 {folder}")
        li.style.fontWeight = "bold"
        file_list <= li

    for name in sorted(files):
        li = html.LI(name)
        li.attrs['data-name'] = name
        li.bind('click', lambda ev, name=name: load_code_from_storage(name))
        li.bind('dblclick', rename_file_prompt)
        file_list <= li


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
    global current_filename
    li = event.currentTarget
    old_name = li.attrs['data-name']
    input_box = html.INPUT(type="text", value=old_name)
    input_box.style.width = "100%"

    def confirm_rename(ev):
        global current_filename
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
            if current_filename == old_name:
                current_filename = new_name
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

# ✅ 設定ポップアップ制御
def toggle_settings_popup(event=None):
    document["settingsPopup"].style.display = "block"
    document["overlay"].style.display = "block"

def close_settings_popup(event=None):
    document["settingsPopup"].style.display = "none"
    document["overlay"].style.display = "none"

def change_font_size(event):
    new_size = document["fontSizeSelect"].value
    editor.style.fontSize = new_size
    document["lineNumbers"].style.fontSize = new_size
    document["consoleOutput"].style.fontSize = new_size
    update_line_numbers(None)

# バインド
document['runButton'].bind('click', run_python_code)
document['saveButton'].bind('click', save_code_to_storage)
document['deleteButton'].bind('click', delete_selected_file)
document['newButton'].bind('click', create_new_file)
document['settingsIcon'].bind('click', toggle_settings_popup)
document['closeSettingsButton'].bind('click', close_settings_popup)
document['overlay'].bind('click', close_settings_popup)
document['fontSizeSelect'].bind('change', change_font_size)


editor.bind('input', update_line_numbers)
editor.bind('scroll', sync_scroll)
editor.bind('keydown', handle_tab)

refresh_file_list()
update_line_numbers(None)
