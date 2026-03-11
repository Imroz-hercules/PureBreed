
#!/usr/bin/env python3
"""
Fixed S7-300/400 DB3 reader (snap7 only)

Configured for your PLC:
- IP   : 192.168.1.10
- Rack : 0
- Slot : 1
- DB   : 3
- Size : 44 (bytes)

What it does
------------
- Connects to 192.168.1.10:102 using rack=0, slot=1
- Reads DB3 bytes 0..43
- Prints a hex dump and decodes REALs at the known offsets
- Exits 0 on success; non-zero on failure

Requirements
------------
pip install python-snap7
"""

import sys
import struct
import snap7

PLC_IP   = "192.168.1.10"
RACK     = 0
SLOT     = 1
DB_NUM   = 3
DB_START = 0
DB_SIZE  = 44

# Tag layout for your DB3 (REALs, 4 bytes each)
TAGS = [
    ("Pellet1_TonHr",   0),
    ("Pellet2_TonHr",   4),
    ("Pellet3_TonHr",   8),
    ("Pellet1_KWTon",  12),
    ("Pellet2_KWTon",  16),
    ("Pellet3_KWTon",  20),
    ("HammerMill_KW",  24),
    ("RollerMill_KW",  28),
    ("Pellet1_Temp",   32),
    ("Pellet2_Temp",   36),
    ("Pellet3_Temp",   40),
]

def hex_dump(b: bytes, width: int = 16) -> str:
    lines = []
    for i in range(0, len(b), width):
        chunk = b[i:i+width]
        hexpart = ' '.join(f"{x:02X}" for x in chunk)
        asciipart = ''.join(chr(x) if 32 <= x < 127 else '.' for x in chunk)
        lines.append(f"{i:04d}: {hexpart:<{width*3}}  {asciipart}")
    return '\n'.join(lines)

def be_real_at(buf: bytes, offset: int) -> float:
    if offset + 4 > len(buf):
        return float('nan')
    # Siemens REAL is big-endian IEEE754
    return struct.unpack('>f', buf[offset:offset+4])[0]

def main() -> int:
    print(f"[*] Connecting to {PLC_IP}:102 (rack={RACK}, slot={SLOT}) ...")
    client = snap7.client.Client()
    try:
        client.connect(PLC_IP, RACK, SLOT, 102)
        if not client.get_connected():
            print("[FAIL] snap7 get_connected() returned False")
            return 3

        print(f"[OK] Connected. Reading DB{DB_NUM} [{DB_START}:{DB_START+DB_SIZE-1}] ...")
        data = client.db_read(DB_NUM, DB_START, DB_SIZE)
        buf = bytes(data)
        print(f"[OK] Read {len(buf)} bytes")
        print("----- HEX DUMP -----")
        print(hex_dump(buf))
        print("--------------------")

        print("----- PARSED REALS -----")
        for name, off in TAGS:
            val = be_real_at(buf, off)
            print(f"{name:16s} : {val:12.6f}")
        print("------------------------")

        print("[PASS] DB read completed.")
        return 0
    except Exception as e:
        print(f"[FAIL] {e}")
        return 1
    finally:
        try:
            client.disconnect()
        except Exception:
            pass

if __name__ == "__main__":
    sys.exit(main())
