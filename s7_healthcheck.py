
#!/usr/bin/env python3
"""
S7 Healthcheck (snap7-only, no snap7types/util)

- Tries a list of (rack,slot) pairs (default includes 0:2 and 0:1 which connected for you).
- On first successful connect:
    * Prints CPU state (RUN/STOP) and PLC datetime (if accessible).
    * Attempts DB reads:
        - DB3 (44 bytes) -> your layout
        - Fallback quick tests: DB1, DB2, DB10 (first 8 bytes each)
    * Hex-dumps any successful read.
- Exits 0 on any successful DB read; otherwise non-zero with reasons.

Usage:
  pip install python-snap7
  python s7_healthcheck.py --ip 192.168.1.10
  python s7_healthcheck.py --ip 192.168.1.10 --combos 0:2 0:1
"""
import argparse, sys, time, struct, datetime
import snap7

DEFAULT_COMBOS = [(0,2), (0,1), (0,3)]

def be_real_at(buf: bytes, off: int) -> float:
    if off+4 > len(buf): return float('nan')
    return struct.unpack('>f', buf[off:off+4])[0]

def hex_dump(b: bytes, width: int = 16) -> str:
    lines = []
    for i in range(0, len(b), width):
        chunk = b[i:i+width]
        hexpart = ' '.join(f"{x:02X}" for x in chunk)
        asciipart = ''.join(chr(x) if 32 <= x < 127 else '.' for x in chunk)
        lines.append(f"{i:04d}: {hexpart:<{width*3}}  {asciipart}")
    return '\n'.join(lines)

def try_connect(ip: str, rack: int, slot: int):
    c = snap7.client.Client()
    c.connect(ip, rack, slot, 102)
    if not c.get_connected():
        raise RuntimeError("get_connected() is False")
    return c

def read_db(c, db: int, start: int, size: int) -> bytes:
    data = c.db_read(db, start, size)
    return bytes(data)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ip", required=True)
    ap.add_argument("--combos", nargs='*', help="Override rack:slot list, e.g. 0:2 0:1")
    args = ap.parse_args()

    combos = DEFAULT_COMBOS
    if args.combos:
        combos = []
        for item in args.combos:
            r,s = item.split(":")
            combos.append((int(r), int(s)))

    last_err = None
    for (rack, slot) in combos:
        print(f"[*] Connecting rack={rack} slot={slot} ...")
        try:
            c = try_connect(args.ip, rack, slot)
            print(f"[OK] Connected rack={rack} slot={slot}")
            # CPU state
            try:
                state = c.get_cpu_state()
                print(f"[i] CPU state: {state}")
            except Exception as e:
                print(f"[!] get_cpu_state failed: {e}")
            # PLC datetime
            try:
                dt = c.get_plc_datetime()
                print(f"[i] PLC datetime: {dt}")
            except Exception as e:
                print(f"[!] get_plc_datetime failed: {e}")

            # Try DB3 (44B) first
            success_any = False
            tests = [(3, 0, 44, "DB3 (expected layout)"),
                     (1, 0, 8,  "DB1 (probe)"),
                     (2, 0, 8,  "DB2 (probe)"),
                     (10,0, 8,  "DB10 (probe)")]
            for db, start, size, label in tests:
                try:
                    print(f"[*] Reading {label}: DB{db} [{start}:{start+size-1}] ...")
                    b = read_db(c, db, start, size)
                    print(f"[OK] Read {len(b)} bytes from DB{db}")
                    print(hex_dump(b))
                    # If DB3 and full 44 bytes, try parsing known REALs
                    if db == 3 and len(b) >= 44:
                        tags = [("Pellet1_TonHr",0),("Pellet2_TonHr",4),("Pellet3_TonHr",8),
                                ("Pellet1_KWTon",12),("Pellet2_KWTon",16),("Pellet3_KWTon",20),
                                ("HammerMill_KW",24),("RollerMill_KW",28),
                                ("Pellet1_Temp",32),("Pellet2_Temp",36),("Pellet3_Temp",40)]
                        print("----- PARSED REALS -----")
                        for name, off in tags:
                            print(f"{name:16s} : {be_real_at(b, off):12.6f}")
                        print("------------------------")
                    success_any = True
                except Exception as e:
                    print(f"[FAIL] {label}: {e}")
            try:
                c.disconnect()
            except: pass

            if success_any:
                print(f"[PASS] Use rack={rack} slot={slot} for ongoing reads.")
                sys.exit(0)
            else:
                print("[!] Connected but could not read any DBs. Check access rights/protection.")
                sys.exit(4)

        except Exception as e:
            print(f"[FAIL] rack={rack} slot={slot} -> {e}")
            last_err = e
            time.sleep(0.5)

    print("No connection succeeded." if last_err is None else f"Last error: {last_err}")
    sys.exit(1)

if __name__ == "__main__":
    main()
