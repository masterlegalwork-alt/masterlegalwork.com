"""Static search audit and optional public-site availability checks. No invented metrics."""
import argparse,collections,csv,datetime,json,sys,urllib.parse,urllib.request,xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HOST='https://masterlegalwork.com'
class Page(HTMLParser):
 def __init__(self):
  super().__init__();self.title='';self.description='';self.h1=0;self.canonical=[];self.refs=[];self.ids=[];self.schema=[];self.image_count=0;self.image_missing_size=0;self.skip=False;self.mode=None;self.data=''
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if a.get('id'):self.ids.append(a['id'])
  if t=='h1':self.h1+=1
  if t=='title':self.mode='title'
  if t=='meta':
   if a.get('name')=='description':self.description=a.get('content','')
   if a.get('http-equiv','').lower()=='refresh' or a.get('name')=='robots' and 'noindex' in a.get('content',''):self.skip=True
  if t=='link' and a.get('rel')=='canonical':self.canonical.append(a.get('href',''))
  for k in ['href','src','data-map']:
   if k in a:self.refs.append(a[k])
  if t=='img':
   self.image_count+=1
   if not a.get('width') or not a.get('height'):self.image_missing_size+=1
  if t=='script' and a.get('type')=='application/ld+json':self.mode='schema';self.data=''
 def handle_data(self,s):
  if self.mode=='title':self.title+=s
  if self.mode=='schema':self.data+=s
 def handle_endtag(self,t):
  if t=='script' and self.mode=='schema':self.schema.append(self.data);self.mode=None
  if t=='title':self.mode=None

def audit(output,live=False,metrics=None):
 pages={};issues=[];notes=[];counts=collections.Counter();canon={};titles={};descriptions={}
 for f in sorted(ROOT.rglob('*.html')):
  p=Page();p.feed(f.read_text());pages[f]=p;counts['html_files']+=1
 for f,p in pages.items():
  rel=str(f.relative_to(ROOT))
  if 'tel:+919872206969' not in p.refs:issues.append(f'{rel}: missing chambers telephone link')
  if p.skip:counts['redirect_or_noindex']+=1;continue
  counts['indexable_pages']+=1
  for label,valid in [('one H1',p.h1==1),('title',bool(p.title.strip())),('description',bool(p.description.strip())),('one canonical',len(p.canonical)==1)]:
   if not valid:issues.append(f'{rel}: missing/invalid {label}')
  for table,key,label in [(titles,p.title,'title'),(descriptions,p.description,'description')]:
   if key in table:issues.append(f'{rel}: duplicate {label} with {table[key]}')
   table[key]=rel
  if len(p.canonical)==1:
   url=p.canonical[0]
   if not url.startswith(HOST+'/'):issues.append(f'{rel}: canonical uses unexpected host')
   if url in canon:issues.append(f'{rel}: duplicate canonical with {canon[url]}')
   canon[url]=rel
  dup=[x for x,n in collections.Counter(p.ids).items() if n>1]
  if dup:issues.append(f'{rel}: duplicate IDs {dup}')
  for block in p.schema:
   try:json.loads(block);counts['structured_data_blocks']+=1
   except ValueError:issues.append(f'{rel}: invalid structured-data JSON')
  counts['images']+=p.image_count;counts['images_without_dimensions']+=p.image_missing_size
  for ref in p.refs:
   u=urllib.parse.urlsplit(ref)
   if u.scheme and u.scheme not in ('http','https'):continue
   if u.netloc and u.netloc not in ('masterlegalwork.com','www.masterlegalwork.com'):continue
   path=urllib.parse.unquote(u.path)
   target=(ROOT/path.lstrip('/') if path.startswith('/') else f.parent/path).resolve() if path else f
   if not target.is_relative_to(ROOT):issues.append(f'{rel}: link escapes root');continue
   if target.is_dir():target=target/'index.html'
   counts['internal_references']+=1
   if not target.exists():issues.append(f'{rel}: missing local link {ref}');continue
   if u.fragment and target.suffix=='.html' and target in pages and u.fragment not in pages[target].ids:issues.append(f'{rel}: missing anchor {ref}')
 sm=ET.parse(ROOT/'sitemap.xml');ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'};urls=[e.text for e in sm.findall('.//s:loc',ns)]
 if len(urls)!=len(set(urls)):issues.append('sitemap.xml: duplicate URLs')
 for url in canon:
  if url not in urls:issues.append(f'sitemap.xml: missing canonical {url}')
 for url in urls:
  if url not in canon:issues.append(f'sitemap.xml: non-indexable or non-canonical URL {url}')
 counts['sitemap_urls']=len(urls)
 if HOST+'/sitemap.xml' not in (ROOT/'robots.txt').read_text():issues.append('robots.txt: missing canonical sitemap')
 for doc in [*ROOT.joinpath('assets/drafts').glob('*.docx'),*ROOT.joinpath('forms/files').glob('*.docx')]:
  if not doc.with_suffix('.pdf').exists():issues.append(f'{doc.relative_to(ROOT)}: missing PDF equivalent')
 counts['model_word_downloads']=len(list(ROOT.joinpath('assets/drafts').glob('*.docx')))+len(list(ROOT.joinpath('forms/files').glob('*.docx')))
 counts['word_downloads']=len(list(ROOT.rglob('*.docx')));counts['pdf_downloads']=len(list(ROOT.rglob('*.pdf')))
 if live:
  for url in [HOST+'/',HOST+'/drafts.html','http://masterlegalwork.com/']:
   try:
    with urllib.request.urlopen(url,timeout=15) as r:notes.append(f'{url}: HTTP {r.status}, final URL {r.url}')
   except Exception as e:notes.append(f'{url}: availability check failed ({type(e).__name__}: {e})')
 if metrics:
  with open(metrics,newline='',encoding='utf-8-sig') as f:rows=list(csv.DictReader(f))
  if rows and {'Clicks','Impressions'}.issubset(rows[0]):
   clicks=sum(float(x['Clicks'].replace(',','')) for x in rows);impressions=sum(float(x['Impressions'].replace(',','')) for x in rows);notes.append(f'Imported Search Console CSV: {clicks:g} clicks, {impressions:g} impressions; aggregate CTR {clicks/impressions:.2%}' if impressions else f'Imported CSV: {clicks:g} clicks, zero impressions.')
  else:issues.append('Metrics CSV requires Clicks and Impressions columns; use one dimension/export and one defined period.')
 else:notes.append('Traffic, rankings and earned backlinks are not measured. Verified Search Console exports/account access are required; no baseline or increase is inferred.')
 s=f'# Technical search audit — {datetime.date.today()}\n\nCritical findings: {len(issues)}.\n\n| Check | Count |\n|---|---:|\n'+''.join(f'| {k.replace("_"," ")} | {v} |\n' for k,v in counts.items())+'\n## Findings\n\n'+ ('\n'.join('- '+x for x in issues) if issues else 'No static audit failures found.')+'\n\n## Availability and measurement\n\n'+'\n'.join('- '+x for x in notes)+'\n\nThis audit does not certify legal accuracy, Google indexing, rendered Core Web Vitals or third-party map pins.\n'
 out=ROOT/output;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(s);out.with_suffix('.json').write_text(json.dumps({'date':str(datetime.date.today()),'counts':dict(counts),'critical_findings':issues,'measurement_notes':notes},indent=2));print(s);return bool(issues)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--output',default='reports/seo-monthly.md');p.add_argument('--live',action='store_true');p.add_argument('--metrics-csv');a=p.parse_args();sys.exit(audit(a.output,a.live,a.metrics_csv))
