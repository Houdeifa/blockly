import serial
from os import path
import time
def main():
    current_folder = path.dirname(path.abspath(__file__))
    generated_folder = path.join(current_folder, "generated")
    program_path = path.join(generated_folder, "user_prog.bin")

    with serial.Serial("COM4", baudrate=115200, timeout=1) as ser:
        binary_data = []
        with open(program_path, "rb") as f:
            binary_data = f.read()

        ser.write(b'A') # Example: send data
        time.sleep(0.01)
        ser.write(b'T') # Example: send data
        time.sleep(0.01)
        ser.write(b'+') # Example: send data
        time.sleep(0.01)
        ser.write(b't') # Example: send data
        time.sleep(0.01)
        ser.write(b'\r')
        time.sleep(0.1)
        for c in str(len(binary_data)):
            ser.write(c.encode('utf-8'))
            time.sleep(0.01)
        ser.write(b'\r')
        time.sleep(0.01)
        for byte in binary_data:
            ser.write(bytes([byte]))
            time.sleep(0.01)
        time.sleep(0.01)
        while ser.in_waiting:
            line = ser.read()
            try:
                print(line.decode('utf-8'),end='')
            except:
                print(str(line) + " ",end='')
        print("Done")
        

if __name__ == '__main__':
    main()