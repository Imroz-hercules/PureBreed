
#!/usr/bin/env python3
"""
Quick TCP port 102 test (RFC1006/ISO-on-TCP). No snap7 required.
Usage:
  python port102_check.py 192.168.1.10
"""
import socket, sys, time

def main():
    if len(sys.argv) < 2:
        print("Usage: python port102_check.py <PLC_IP> [timeout_sec]")
        sys.exit(2)
    ip = sys.argv[1]
    timeout = float(sys.argv[2]) if len(sys.argv) > 2 else 3.0
    addr = (ip, 102)
    print(f"[*] Connecting to {addr} with timeout {timeout}s ...")
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    t0 = time.time()
    try:
        s.connect(addr)
        dt = time.time() - t0
        print(f"[OK] TCP 102 reachable in {dt*1000:.0f} ms")
        sys.exit(0)
    except Exception as e:
        print(f"[FAIL] {e}")
        sys.exit(1)
    finally:
        try: s.close()
        except: pass

if __name__ == "__main__":
    main()
