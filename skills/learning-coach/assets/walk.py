import re,glob,sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import cmap,reflow
from gloss import G  # author-written dict: node label -> (English gloss, second-language gloss)
D='/Users/allenfeng/Documents/OPSEC/claude-architect-prep/course/'
def conv(svg):
    aria,cls,nodes,edges=reflow.parse(svg)
    byc=[[] for _ in cls]
    for i,n in enumerate(nodes):
        k=[j for j,c in enumerate(cls) if c['y']<=n['y']<=c['y']+c['h']][0]; n['id']='n%d'%i; byc[k].append(n)
    C=[]
    for c,ns in zip(cls,byc):
        rows={}
        for n in ns: rows.setdefault(n['y'],[]).append(n)
        C.append((c['en'],c['zh'],[[(n['id'],'|'.join(n['en']),n['zh']) for n in sorted(r,key=lambda n:n['x'])] for _,r in sorted(rows.items())]))
    E=[]
    for e in edges:
        pts=[tuple(map(float,p.split())) for p in re.findall(r'[ML]\s*([\d.]+ [\d.]+)',e['d'])]
        a=reflow.inode(nodes,*pts[0]);b=reflow.inode(nodes,*pts[-1])
        kind='loop' if len(pts)>2 else ('dash' if e['dash'] else '')
        E.append((nodes[a]['id'],nodes[b]['id'],e['en'],e['zh'])+((kind,) if kind else ()))
    return aria,C,E
def title(s): return s.capitalize() if s.isupper() else s
def build(f,mapsrc,intro,groups,links,final,last_aria_note=''):
    p=glob.glob(D+f+'-*.html')[0]; t=open(p).read()
    svgs=[m.group(0) for m in re.finditer(r'<svg.*?</svg>',t,flags=re.S) if 'class="cluster"' in m.group(0) and 'chapter' in re.search(r'aria-label="([^"]*)"',m.group(0)).group(1)[:30]]
    svg=svgs[0]; aria,C,E=conv(svg)
    cmap._n[0]=100
    out=f'<p class="en">{intro[0]}</p>\n  <p class="l2">{intro[1]}</p>\n'
    for i,(c,g) in enumerate(zip(C,groups)):
        ids={n[0] for r in c[2] for n in r}
        ie=[e for e in E if e[0] in ids and e[1] in ids]
        small=cmap.render([c],ie,'Group %d of the chapter map: %s'%(i+1,c[0].lower()))
        if i>0:
            out+=f'  <p class="en link"><em>{links[i-1][0]}</em></p>\n  <p class="l2 link"><em>{links[i-1][1]}</em></p>\n'
        out+=f'  <h3><span class="en">{title(c[0])}</span><span class="l2">{c[1]}</span></h3>\n  {small}\n  <p class="en">{g[0]}</p>\n  <p class="l2">{g[1]}</p>\n'
        ns=[n for r in c[2] for n in r]
        out+='  <ul class="gloss">\n'+''.join('    <li><span class="en"><strong>%s%s</strong> %s</span><span class="l2"><strong>%s：</strong>%s</span></li>\n'%(n[1].replace('|',' '),'' if n[1].endswith('?') else ':',G[n[1].replace('|',' ')][0],n[2],G[n[1].replace('|',' ')][1]) for n in ns)+'  </ul>\n'
    cmap._n[0]=200
    out+=f'  <h3><span class="en">The whole chapter, connected</span><span class="l2">整章连起来</span></h3>\n  <p class="en">{final[0]}</p>\n  <p class="l2">{final[1]}</p>\n  {cmap.render(C,E,aria)}\n'
    t2=re.sub(r'(<section id="bigpicture">).*?(</section>)',lambda m:m.group(1)+'\n  '+out+m.group(2),t,count=1,flags=re.S)
    open(p,'w').write(t2)
