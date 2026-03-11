# plc_db_scan_dump_safe.py
# Usage:
#   py plc_db_scan_dump_safe.py                  # ip=192.168.2.18 rack=0 slot=3, dump up to 256 bytes
#   py plc_db_scan_dump_safe.py 192.168.2.18 0 3 128

import sys, time, string, snap7

def connect(ip, rack=0, slot=3, conn_type=3, tcpport=102):
    c = snap7.client.Client()
    c.set_connection_type(conn_type)  # 3=Basic, 1=PG, 2=OP
    c.connect(ip, rack, slot, tcpport)
    if not c.get_connected():
        raise RuntimeError("Connected() returned False")
    return c

def db_exists_1byte(client, dbn):
    try:
        b = client.db_read(dbn, 0, 1)
        return bool(b and len(b) == 1)
    except Exception as e:
        msg = str(e).lower()
        if "item not available" in msg:
            return False     # DB doesn't exist
        # Any permission/protection errors show up as not accessible for our purposes
        return False

def estimate_db_size(client, dbn, hard_cap=65536):
    """
    Estimate DB size with minimal failures:
      1) exponential growth (1, 8, 16, 32, 64, ...) until it fails
      2) binary search between last_ok and first_fail-1
    Returns an integer size (>=1) or 0 if unreadable.
    """
    # First confirm existence via 1 byte
    if not db_exists_1byte(client, dbn):
        return 0

    # Exponential growth
    last_ok = 1
    size = 1
    first_fail = None
    steps = [1, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, hard_cap]
    for s in steps:
        try:
            client.db_read(dbn, 0, s)
            last_ok = s
        except Exception:
            first_fail = s
            break
    if first_fail is None:
        # We never failed up to hard_cap; assume hard_cap
        return min(last_ok, hard_cap)

    # Binary search between last_ok and first_fail-1
    lo, hi = last_ok, max(last_ok, first_fail - 1)
    while lo < hi:
        mid = (lo + hi + 1) // 2
        try:
            client.db_read(dbn, 0, mid)
            lo = mid
        except Exception:
            hi = mid - 1
    return lo

def hexdump(buf, width=16):
    def is_printable(b):
        ch = chr(b)
        return ch in string.printable and ch not in "\r\n\t\x0b\x0c"
    lines = []
    for i in range(0, len(buf), width):
        chunk = buf[i:i+width]
        hexpart = " ".join(f"{b:02X}" for b in chunk).ljust(width*3-1)
        asciip = "".join(chr(b) if is_printable(b) else "." for b in chunk)
        lines.append(f"{i:04X}  {hexpart}  |{asciip}|")
    return "\n".join(lines) if lines else "(no data)"

def main():
    ip   = sys.argv[1] if len(sys.argv) > 1 else "192.168.2.3"
    rack = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    slot = int(sys.argv[3]) if len(sys.argv) > 3 else 3
    dump_cap = int(sys.argv[4]) if len(sys.argv) > 4 else 256

    print(f"Scanning DB1–DB10 on {ip} rack={rack} slot={slot}\n")
    c = connect(ip, rack, slot)
    try:
        try:
            print("CPU state:", c.get_cpu_state())
        except Exception:
            pass

        found = []
        for dbn in range(1, 11):
            if db_exists_1byte(c, dbn):
                print(f"DB{dbn:>2}: FOUND")
                found.append(dbn)
            else:
                print(f"DB{dbn:>2}: NOT PRESENT")
            if dbn % 50 == 0:
                time.sleep(0.02)

        if not found:
            print("\nNo accessible DBs in 1–10.")
            return

        print("\nEstimating sizes (avoids out-of-range errors)...")
        sizes = {}
        for dbn in found:
            sz = estimate_db_size(c, dbn, hard_cap=dump_cap)
            sizes[dbn] = sz
            print(f"  DB{dbn}: ~{sz} bytes readable")

        print("\nDumping bytes:")
        for dbn in found:
            n = min(sizes[dbn], dump_cap)
            if n <= 0:
                print(f"--- DB{dbn}: (size 0? no data) ---\n(no data)\n")
                continue
            try:
                data = bytes(c.db_read(dbn, 0, n))
            except Exception:
                print(f"--- DB{dbn}: read failed unexpectedly at {n} bytes ---\n")
                continue
            print(f"--- DB{dbn} (first {n} bytes) ---")
            print(hexdump(data))
            print()

    finally:
        try: c.disconnect()
        except: pass
        try: c.destroy()
        except: pass

if __name__ == "__main__":
    main()
