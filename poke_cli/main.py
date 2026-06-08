#!/usr/bin/env python3
"""Poke CLI v1.1 — Fleet management for Poke Labs agent infrastructure."""

import sys, os, json, subprocess, argparse
from datetime import datetime

__version__ = "1.1.0"

WALLET = "0xca3d86e4EDE205E6d72496BC2919c88b994B6beF"
CREATOR = "0xb618679b989ed4f3dF32aA63daD525e680461dfe"

def get_services_dir():
    return os.environ.get("POKE_SERVICES", "/home/alx/services")

def cmd_status(args):
    print(f"Poke Labs v{__version__} | Wallet: {WALLET}")
    d = get_services_dir()
    if os.path.isdir(d):
        dirs = [x for x in os.listdir(d) if os.path.isdir(os.path.join(d, x))]
        print(f"{len(dirs)} services on disk at {d}")

def cmd_list(args):
    d = get_services_dir()
    if not os.path.isdir(d):
        print(f"Not found: {d}"); return
    for name in sorted(os.listdir(d)):
        p = os.path.join(d, name, "server.py")
        print(f"  {'[HTTP]' if os.path.exists(p) else '[tool]'} {name}")

def cmd_start(args):
    service = args.name
    path = os.path.join(get_services_dir(), service, "server.py")
    if not os.path.exists(path):
        print(f"Not found: {service}"); return
    subprocess.Popen(["python3", path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Started {service}")

def cmd_stop(args):
    service = args.name
    os.system(f'pkill -f "{service}/server.py" 2>/dev/null')
    print(f"Stopped {service}")

def cmd_health(args):
    import urllib.request
    try:
        resp = urllib.request.urlopen(f"http://localhost:{args.port}/api/health", timeout=3)
        data = json.loads(resp.read())
        print(f"OK port {args.port}: v{data.get('v','?')}")
    except:
        print(f"DOWN port {args.port}")

def cmd_version(args):
    print(__version__)

def main():
    p = argparse.ArgumentParser(prog="poke", description="Poke Labs CLI")
    sub = p.add_subparsers(dest="cmd")
    sub.add_parser("status")
    sub.add_parser("list")
    sp = sub.add_parser("start"); sp.add_argument("name")
    sp = sub.add_parser("stop"); sp.add_argument("name")
    sp = sub.add_parser("health"); sp.add_argument("--port", type=int, default=8765)
    sub.add_parser("version")
    args = p.parse_args()
    cmds = {"status": cmd_status, "list": cmd_list, "start": cmd_start,
            "stop": cmd_stop, "health": cmd_health, "version": cmd_version}
    if args.cmd in cmds:
        cmds[args.cmd](args)
    else:
        p.print_help()

if __name__ == "__main__":
    main()
