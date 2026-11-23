"""Concept-map renderer: clusters of rows of nodes, labelled edges, optional loops. Returns an inline bilingual svg."""
import html
W=500; X0=4; CW=468; NH=60; GAP=54; HEAD=30; PAD=14; CGAP=36; LOOPX=490
def esc(s): return html.escape(s)
_n=[0]
def render(clusters, edges, aria):
    _n[0]+=1; mid='ah%d'%_n[0]
    N={}; out=[]; y=4; g=0; CL={}; CB={}
    for cen,czh,rows in clusters:
        ch=HEAD+len(rows)*NH+(len(rows)-1)*GAP+PAD
        out.append(f'<rect class="cluster" x="{X0}" y="{y}" width="{CW}" height="{ch}" rx="12"/>')
        out.append(f'<text class="en cl" x="{X0+12}" y="{y+18}">{esc(cen)}</text><text class="l2 cl" x="{X0+12+len(cen)*6.6+12:.0f}" y="{y+18}">{esc(czh)}</text>')
        CB[cen]=(y,y+ch); ry=y+HEAD
        for r,row in enumerate(rows):
            n=len(row); w={1:240,2:170,3:120}[n]
            xs={1:[X0+(CW-240)/2],2:[X0+14,X0+CW-14-170],3:[X0+10,X0+(CW-120)/2,X0+CW-10-120]}[n]
            for (i,en,zh),x in zip(row,xs): N[i]=(x,ry,w,NH,en,zh,g); CL[i]=cen
            g+=1
            ry+=NH+GAP
        y+=ch+CGAP
    H=y-CGAP+8
    def anchor(i,s):
        x,y,w,h=N[i][:4]; return {"t":(x+w/2,y),"b":(x+w/2,y+h),"l":(x,y+h/2),"r":(x+w,y+h/2)}[s]
    for i,(x,y,w,h,en,zh,_) in N.items():
        out.append(f'<rect class="node" x="{x}" y="{y}" width="{w}" height="{h}" rx="8"/>')
        for cls,t in (("en",en),("l2",zh)):
            ls=t.split("|"); 
            for k,l in enumerate(ls):
                out.append(f'<text class="{cls}" x="{x+w/2}" y="{y+h/2-(len(ls)-1)*7.5+k*15+4.5:.1f}" text-anchor="middle">{esc(l)}</text>')
    for e in edges:
        a,b,len_,lzh=e[:4]; kind=e[4] if len(e)>4 else ""
        dash=" dash" if kind in("dash","loop") else ""
        if kind=="loop":
            p1=anchor(a,"r"); p2=anchor(b,"r"); pts=[p1,(LOOPX,p1[1]),(LOOPX,p2[1]),p2]; lx,ly=LOOPX+12,(p1[1]+p2[1])/2
        else:
            ra,rb=N[a][6],N[b][6]
            if ra==rb: s1,s2=("r","l") if N[a][0]<N[b][0] else ("l","r")
            else: s1,s2=("b","t") if rb>ra else ("t","b")
            p1,p2=anchor(a,s1),anchor(b,s2)
            if s1 in "bt":
                ca,cb=p1[0],p2[0]; sh=lambda w:max(-w/2+14,min(w/2-14,0))
                p1=(p1[0]+max(-N[a][2]/2+14,min(N[a][2]/2-14,(cb-ca)*.3)),p1[1]); p2=(p2[0]+max(-N[b][2]/2+14,min(N[b][2]/2-14,(ca-cb)*.3)),p2[1])
            pts=[p1,p2]; t=.5
            if CL[a]!=CL[b] and p2[1]!=p1[1]:
                ym=(CB[CL[a]][1]+CGAP/2) if rb>ra else (CB[CL[a]][0]-CGAP/2); t=(ym-p1[1])/(p2[1]-p1[1])
            lx,ly=p1[0]+(p2[0]-p1[0])*t,p1[1]+(p2[1]-p1[1])*t
        d="M"+" L".join(f"{px:.0f} {py:.0f}" for px,py in pts)
        out.append(f'<path class="arrow{dash}" d="{d}" marker-end="url(#{mid})"/>')
        if kind=="loop":
            out.append(f'<g transform="rotate(-90 {lx:.0f} {ly:.0f})"><text class="en lab" x="{lx:.0f}" y="{ly:.0f}" text-anchor="middle">{esc(len_)}</text><text class="l2 lab" x="{lx:.0f}" y="{ly:.0f}" text-anchor="middle">{esc(lzh)}</text></g>')
        else:
            w=max(len(len_)*5.4,len(lzh)*10.5)+10
            out.append(f'<rect class="lbg" x="{lx-w/2:.1f}" y="{ly-13:.1f}" width="{w:.1f}" height="26" rx="4"/>')
            out.append(f'<text class="en lab" x="{lx:.0f}" y="{ly+3.5:.1f}" text-anchor="middle">{esc(len_)}</text><text class="l2 lab" x="{lx:.0f}" y="{ly+3.5:.1f}" text-anchor="middle">{esc(lzh)}</text>')
    return (f'<svg viewBox="0 0 {W} {H:.0f}" role="img" aria-label="{esc(aria)}"><title>{esc(aria)}</title>'
      f'<defs><marker id="{mid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>'+"".join(out)+'</svg>')
