"""Check public DNS, verified TLS and essential URLs; never bypass certificate validation."""
import concurrent.futures,datetime,json,os,socket,ssl,sys,urllib.request
from pathlib import Path
HOST='masterlegalwork.com'
NOW=datetime.datetime.now(datetime.timezone.utc)
URLS={
 'https://masterlegalwork.com/':'href="tel:+919872206969"',
 'https://www.masterlegalwork.com/':'href="tel:+919872206969"',
 'https://masterlegalwork.com/resources/':'litigant-tools',
 'https://masterlegalwork.com/contact.html':'href="tel:+919872206969"',
 'https://masterlegalwork.com/robots.txt':'Sitemap: https://masterlegalwork.com/sitemap.xml',
 'https://masterlegalwork.com/sitemap.xml':'https://masterlegalwork.com/resources/',
}
def tls(host):
 result={'host':host}
 try:
  addresses=socket.getaddrinfo(host,443,type=socket.SOCK_STREAM)
  result['addresses']=sorted({x[4][0] for x in addresses})
  with socket.create_connection((host,443),timeout=15) as sock:
   with ssl.create_default_context().wrap_socket(sock,server_hostname=host) as secure:
    cert=secure.getpeercert()
    expires=datetime.datetime.fromtimestamp(ssl.cert_time_to_seconds(cert['notAfter']),datetime.timezone.utc)
    result.update(verified=True,protocol=secure.version(),expires=expires.isoformat(),days_remaining=(expires-NOW).days,subject_alt_names=[value for kind,value in cert.get('subjectAltName',[]) if kind=='DNS'])
    result['ok']=expires>NOW+datetime.timedelta(days=7)
 except Exception as exc:
  result.update(ok=False,verified=False,error=f'{type(exc).__name__}: {exc}')
 return result

def page(item):
 url,marker=item;result={'url':url}
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'MasterLegalWork-SiteHealth/1.0'})
  with urllib.request.urlopen(req,timeout=15) as res:
   body=res.read(2_000_000).decode('utf-8',errors='replace')
   result.update(status=res.status,final_url=res.url,marker_found=marker in body)
   result['ok']=res.status==200 and res.url.startswith('https://masterlegalwork.com/') and marker in body
 except Exception as exc:
  result.update(ok=False,error=f'{type(exc).__name__}: {exc}')
 return result

def dns(qtype):
 try:
  with urllib.request.urlopen(f'https://dns.google/resolve?name={HOST}&type={qtype}',timeout=15) as res:
   data=json.load(res)
  return {'type':qtype,'status':data.get('Status'),'answers':data.get('Answer',[])}
 except Exception as exc:return {'type':qtype,'error':f'{type(exc).__name__}: {exc}'}

def main():
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  futures=[pool.submit(tls,h) for h in [HOST,'www.'+HOST]]
  pages=list(pool.map(page,URLS.items()))
  certificates=[f.result() for f in futures]
  records=list(pool.map(dns,['A','AAAA','CAA','NS']))
 report={'checked_at':NOW.isoformat(),'tls':certificates,'pages':pages,'dns':records}
 report['ok']=all(x['ok'] for x in certificates+pages)
 out=Path('reports/site-health.json');out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(report,indent=2)+'\n')
 lines=['# Public website health',f'Checked: {NOW.isoformat()}','',f"Result: {'PASS' if report['ok'] else 'ATTENTION REQUIRED'}",'','## Verified TLS']
 for c in certificates:lines.append(f"- {c['host']}: "+(f"valid; expires {c['expires']}; {c['days_remaining']} days remaining" if c.get('verified') else c.get('error','failed')))
 lines+=['','## Essential pages']
 for p in pages:lines.append(f"- {p['url']}: "+(f"HTTP {p['status']}; correct content: {p['marker_found']}" if 'status' in p else p.get('error','failed')))
 lines+=['','DNS answers and full results are in site-health.json. A passing check verifies availability at this time; it does not measure search rankings or traffic.']
 summary='\n'.join(lines)+'\n';Path('reports/site-health.md').write_text(summary)
 if os.environ.get('GITHUB_STEP_SUMMARY'):
  with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as f:f.write(summary)
 print(summary)
 return 0 if report['ok'] else 1
if __name__=='__main__':sys.exit(main())
