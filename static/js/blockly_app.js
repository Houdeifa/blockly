const workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox')
  });
  
  document.getElementById('generateBtn').addEventListener('click', () => {
    // generate JavaScript code (intermediate)
    
    Blockly.C.init();
    // convert from JS to C using our C generator
    const cCode = Blockly.C.workspaceToCode(workspace);

    console.log(Blockly.C);
    document.getElementById('output').textContent = cCode;
    // send to server
    fetch('/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ c_code: cCode })
    })
    .then(res => res.json())
    .then(json => {
      if(json.status === 'success') {
        document.getElementById('output').textContent += `\nCompiled to ${json.object_file}`;
      } else {
        document.getElementById('output').textContent += `\nError: ${json.message}`;
      }
    });
  });