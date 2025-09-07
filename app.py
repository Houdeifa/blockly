from flask import Flask, render_template, request, jsonify
import os
import subprocess
import json
app = Flask(__name__)




# directory to store generated C code
CURRENT_DIR = os.path.abspath(os.path.dirname(__file__))
CODE_DIR = os.path.join(CURRENT_DIR, 'generated')
ARM_TOOL_CHAIN_DIR = os.path.join(CURRENT_DIR, 'gcc-arm-none-eabi-10.3-2021.10')
ARM_TOOL_CHAIN_BIN_DIR = os.path.join(ARM_TOOL_CHAIN_DIR, 'bin')
ARM_TOOL_CHAIN_GCC_DIR = os.path.join(ARM_TOOL_CHAIN_BIN_DIR, 'arm-none-eabi-gcc.exe')
ARM_TOOL_CHAIN_OBJDUMP_DIR = os.path.join(ARM_TOOL_CHAIN_BIN_DIR, 'arm-none-eabi-objdump.exe')
ARM_TOOL_CHAIN_OBJCOPY_DIR = os.path.join(ARM_TOOL_CHAIN_BIN_DIR, 'arm-none-eabi-objcopy.exe')
print(CODE_DIR)
os.makedirs(CODE_DIR, exist_ok=True)

starting_addr = 0x20005700
# predefined functions available to user code
# format: {'display_name': 'Function 1', 'func_name': 'FUNC1}


json_path = os.path.join(CURRENT_DIR, 'functions.json')
with open(json_path, 'r') as f:
    functions = json.load(f)

@app.route('/')
def index():
    return render_template('index.html', functions=functions)

def cast_func_address(addr):
    return f"((void (*)(int)) (*(uint32_t*){addr}))"

@app.route('/compile', methods=['POST'])
def compile_code():
    # receive C code from client
    c_code = request.json.get('c_code')
    filename = 'user_prog.c'
    filepath = os.path.join(CODE_DIR, filename)
    with open(filepath, 'w') as f:
        f.write(c_code)


    defines = []
    for i,function in enumerate(functions):
      addr = starting_addr + i*4
      _,func_name = function
      defines.append('-D')
      defines.append(f'{func_name}={cast_func_address(str(hex(addr)))}')
    # compile with ARM toolchain (compile-only, no linking)
    output_obj = filepath.replace('.c', '.o')
    output_bin = filepath.replace('.c', '.bin')
    cmd1 = [
        ARM_TOOL_CHAIN_GCC_DIR,
        '-mcpu=cortex-m3',
        '-mthumb',
        *defines,
        '-c', filepath,
        '-o', output_obj
    ]
    cmd2 = [
        ARM_TOOL_CHAIN_OBJCOPY_DIR,
        '-O', 'binary',
         output_obj,
        output_bin
    ]
    try:
        subprocess.run(cmd1, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        subprocess.run(cmd2, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return jsonify({ 'status': 'success', 'object_file': os.path.basename(output_bin) })
    except subprocess.CalledProcessError as e:
        return jsonify({ 'status': 'error', 'message': e.stderr.decode() }), 400

if __name__ == '__main__':
    app.run(debug=True)

# Note: The serial_send_program.py script is assumed to be in the same directory as app.py and is used to send the compiled binary over serial.
# You can run it separately after compiling the code via the Flask app.