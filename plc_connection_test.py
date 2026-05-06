#!/usr/bin/env python3
"""
PLC connection test for Siemens S7 (ISO-on-TCP / port 102).

  1) TCP port 102 reachability (stdlib only).
  2) Optional snap7 session: connect with rack/slot, read CPU state.

Defaults match a typical S7-1200/1500 style setup (rack 0, slot 1–3 varies by CPU).

  pip install python-snap7
  # Windows: install Snap7 DLL so python-snap7 can load it.

Examples:
  python plc_connection_test.py
  python plc_connection_test.py --ip 192.168.20.1 --rack 0 --slot 3
  python plc_connection_test.py --tcp-only
"""
from __future__ import annotations

import argparse
import socket
import sys
import time


S7_PORT = 102


def check_tcp_102(ip: str, timeout: float) -> tuple[bool, str, float]:
    addr = (ip, S7_PORT)
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    t0 = time.perf_counter()
    try:
        sock.connect(addr)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        return True, f"TCP {S7_PORT} reachable in {elapsed_ms:.0f} ms", elapsed_ms
    except OSError as e:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        return False, f"TCP {S7_PORT} failed: {e}", elapsed_ms
    finally:
        try:
            sock.close()
        except OSError:
            pass


def check_snap7(ip: str, rack: int, slot: int, timeout: float) -> tuple[bool, str]:
    try:
        import snap7
    except ImportError:
        return False, "python-snap7 not installed (pip install python-snap7)"

    client = snap7.client.Client()
    if timeout and hasattr(client, "set_connection_params"):
        try:
            client.set_connection_params(ip, rack, slot)
        except Exception:
            pass
    try:
        if hasattr(client, "set_connection_timeout"):
            try:
                client.set_connection_timeout(int(timeout * 1000))
            except Exception:
                pass
        client.connect(ip, rack, slot, S7_PORT)
        if not client.get_connected():
            return False, "snap7 connect returned but get_connected() is False"
        parts = []
        try:
            state = client.get_cpu_state()
            parts.append(f"CPU state: {state}")
        except Exception as e:
            parts.append(f"CPU state: (error) {e}")
        try:
            dt = client.get_plc_datetime()
            parts.append(f"PLC time: {dt}")
        except Exception as e:
            parts.append(f"PLC time: (skip) {e}")
        return True, " | ".join(parts)
    except Exception as e:
        return False, f"snap7: {e}"
    finally:
        try:
            client.disconnect()
        except Exception:
            pass


def main() -> int:
    p = argparse.ArgumentParser(description="Test Siemens S7 PLC reachability (TCP 102 + optional snap7).")
    p.add_argument("--ip", default="192.168.20.1", help="PLC IP address")
    p.add_argument("--rack", type=int, default=0, help="Rack (usually 0)")
    p.add_argument("--slot", type=int, default=3, help="Slot (CPU-dependent, e.g. 1 or 2 for S7-1200)")
    p.add_argument("--timeout", type=float, default=3.0, help="Seconds for TCP connect and snap7")
    p.add_argument("--tcp-only", action="store_true", help="Only test TCP port 102 (no snap7)")
    args = p.parse_args()

    print(f"[*] Target {args.ip} rack={args.rack} slot={args.slot} (timeout {args.timeout}s)")
    ok_tcp, tcp_msg, _ms = check_tcp_102(args.ip, args.timeout)
    print(f"{'[OK]' if ok_tcp else '[FAIL]'} {tcp_msg}")
    if not ok_tcp:
        return 1

    if args.tcp_only:
        print("[PASS] TCP check only (--tcp-only).")
        return 0

    ok_s7, s7_msg = check_snap7(args.ip, args.rack, args.slot, args.timeout)
    print(f"{'[OK]' if ok_s7 else '[FAIL]'} {s7_msg}")
    if not ok_s7:
        print("[WARN] TCP port is open but S7 session failed (wrong rack/slot, protection, or snap7/DLL issue).")
        return 2

    print("[PASS] TCP and snap7 session OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
