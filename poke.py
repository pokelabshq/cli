#!/usr/bin/env python3
"""Poke CLI v1.0 - Zero-dependency command-line toolkit. MIT License."""
import sys, hashlib, json, re, time, urllib.request, urllib.parse, socket

VERSION = "1.0.0"

def cmd_hash(args):
    text = " ".join(args) if args else sys.stdin.read()
    print(f"SHA256: {hashlib.sha256(text.encode()).hexdigest()}")
    print(f"MD5:    {hashlib.md5(text.encode()).hexdigest()}")

def cmd_uuid():
    import random
    h = lambda: f"{random.getrandbits(128):032x}"
    u = h()
    print(f"{u[:8]}-{u[8:12]}-{u[12:16]}-{u[16:20]}-{u[20:]}")

def cmd_color(args):
    hc = (args[0] if args else "#00d4ff").lstrip("#")
    if len(hc) == 3: hc = "".join(c*2 for c in hc)
    r, g, b = int(hc[0:2],16), int(hc[2:4],16), int(hc[4:6],16)
    r2,g2,b2 = r/255,g/255,b/255
    mx,mn = max(r2,g2,b2), min(r2,g2,b2)
    l = (mx+mn)/2
    if mx==mn: h=s=0
    else:
        d=mx-mn; s=d/(2-mx-mn) if l>0.5 else d/(mx+mn)
        if mx==r2: h=(g2-b2)/d+(6 if g2<b2 else 0)
        elif mx==g2: h=(b2-r2)/d+2
        else: h=(r2-g2)/d+4
        h/=6
    print(f"Hex:  #{hc}")
    print(f"RGB:  rgb({r}, {g}, {b})")
    print(f"HSL:  hsl({h*360:.0f}, {s*100:.0f}%, {l*100:.0f}%)")

def cmd_json2ts(args):
    text = " ".join(args) if args else sys.stdin.read()
    try: data = json.loads(text)
    except: print("Error: Invalid JSON"); return
    def infer(v):
        if isinstance(v,bool): return "boolean"
        if isinstance(v,int): return "number"
        if isinstance(v,float): return "number"
        if isinstance(v,str): return "string"
        if isinstance(v,list): return f"{infer(v[0])}[]" if v else "any[]"
        if isinstance(v,dict): return None
        return "any"
    def gen(obj,name="Root",ind=0):
        lines=[]; p="  "*ind
        if ind==0: lines.append(f"interface {name} {{")
        for k,v in obj.items():
            sk=re.sub(r"[^a-zA-Z0-9_]","_",k); t=infer(v)
            if t is None:
                lines.append(f"{p}  {sk}: {{")
                for k2,v2 in v.items():
                    sk2=re.sub(r"[^a-zA-Z0-9_]","_",k2); t2=infer(v2)
                    lines.append(f"{p}    {sk2}: {t2 or 'Record<string,any>'};")
                lines.append(f"{p}  }};")
            else: lines.append(f"{p}  {sk}: {t};")
        if ind==0: lines.append("}")
        return "\n".join(lines)
    if isinstance(data,dict): print(gen(data))
    elif isinstance(data,list) and data and isinstance(data[0],dict): print(gen(data[0],"RootItem"))
    else: print(f"type Root = {infer(data)};")

def cmd_timestamp(args):
    if args:
        try:
            ts=int(args[0]); print(f"Unix: {ts}")
            print(f"UTC:  {time.strftime('%Y-%m-%d %H:%M:%S UTC',time.gmtime(ts))}")
        except: print("Error: Invalid timestamp")
    else:
        now=int(time.time()); print(f"Unix: {now}")
        print(f"UTC:  {time.strftime('%Y-%m-%d %H:%M:%S UTC',time.gmtime(now))}")

def cmd_keywords(args):
    text=" ".join(args) if args else sys.stdin.read()
    sw={"the","a","an","is","are","was","were","be","been","have","has","had","do","does","did","will","would","could","should","to","of","in","for","on","with","at","by","from","as","it","its","this","that","and","or","not","but"}
    words=re.findall(r"[a-zA-Z]{3,}",text.lower()); freq={}
    for w in words:
        if w not in sw: freq[w]=freq.get(w,0)+1
    for word,cnt in sorted(freq.items(),key=lambda x:-x[1])[:15]:
        bar = "#" * min(cnt,20)
        print(f"  {word:20s} {cnt:3d} {bar}")

def cmd_preview(args):
    url=args[0] if args else "https://github.com"
    try:
        req=urllib.request.Request(url,headers={"User-Agent":"PokeCLI/1.0"})
        with urllib.request.urlopen(req,timeout=10) as r: html=r.read().decode("utf-8",errors="ignore")
        def og(p):
            m=re.search(r"og:" + p + r"[\"'].*?content=[\"'] ([^"']+)", html, re.I)
            return m.group(1) if m else ""
        tm=re.search(r"<title[^>]*>([^<]+)</title>", html, re.I)
        title=tm.group(1).strip() if tm else og("title") or "No title"
        desc=og("description") or "No description"
        image=og("image") or ""
        site=og("site_name") or urllib.parse.urlparse(url).netloc
        print(f"Title:       {title}\nDescription: {desc}\nImage:       {image}\nSite:        {site}\nURL:         {url}")
    except Exception as e: print(f"Error: {e}")

def cmd_status():
    print("Poke Labs Service Status")
    for name,port in [("Dashboard",8760),("Landing",8750),("Link Preview",8765),("Poke Labs Site",8766),("Poke Bot",8770),("Poke Hub",8775),("Telegram",8777),("Pricing",8790)]:
        try:
            s=socket.socket(); s.settimeout(0.5)
            up=s.connect_ex(("127.0.0.1",port))==0; s.close()
            print(f"  {name:20s} :{port} {"UP" if up else "DOWN"}")
        except: print(f"  {name:20s} :{port} DOWN")

def cmd_version():
    print(f"Poke CLI v{VERSION} -- pokelabshq")

def main():
    if len(sys.argv)<2:
        print("Poke CLI v1.0 -- poke <command> [args]")
        print("Commands: hash uuid color json2ts timestamp keywords preview status version")
        return
    cmd=sys.argv[1]; args=sys.argv[2:]
    cmds={"hash":cmd_hash,"uuid":cmd_uuid,"color":cmd_color,"json2ts":cmd_json2ts,"timestamp":cmd_timestamp,"keywords":cmd_keywords,"preview":cmd_preview,"status":cmd_status,"version":cmd_version}
    if cmd in cmds: cmds[cmd](args)
    elif cmd in ("-h","--help","help"):
        print("Poke CLI v1.0 -- poke <command> [args]")
        print("Commands: hash uuid color json2ts timestamp keywords preview status version")
    else: print(f"Unknown: {cmd}")

if __name__=="__main__": main()
