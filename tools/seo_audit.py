"""Monthly repository audit. Traffic requires verified account data."""
from pathlib import Path
from html.parser import HTMLParser
from datetime import date
class Page(HTMLParser):
 def __init__(self):super().__init__();self.title=0;self.h1=0;self.canonical=0;self.description=0
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=='title':self.title+=1
  if t=='h1':self.h1+=1
  if t=='link' and a.get('rel')=='canonical':self.canonical+=1
  if t=='meta' and a.get('name')=='description' and a.get('content'):self.description+=1
root=Path(__file__).resolve().parents[1];issues=[];pages=list(root.rglob('*.html'))
for f in pages:
 source=f.read_text()
 if 'http-equiv="refresh"' in source or 'content="noindex' in source:continue
 p=Page();p.feed(source)
 for k in ['title','h1','canonical','description']:
  if getattr(p,k)!=1:issues.append(f'{f.relative_to(root)}: {k} count {getattr(p,k)}')
s=f'# Technical search audit — {date.today()}\n\nPages checked: {len(pages)}. Findings: {len(issues)}.\n\n'+'\n'.join('- '+i for i in issues)+'\n\nTraffic, query rankings and backlinks: not measured; verified Search Console data required.\n'
out=root/'reports/seo-monthly.md';out.parent.mkdir(exist_ok=True);out.write_text(s);print(s)
